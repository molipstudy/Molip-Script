import { createClient } from '@supabase/supabase-js'

// Server only: privileged Auth credentials must never reach a browser bundle.
export async function handleMemberEmail(req, res, { env = process.env, fetcher = fetch, makeClient = createClient } = {}) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('Vary', 'Authorization')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }) }
  const authorization = req.headers.authorization
  if (typeof authorization !== 'string' || !/^Bearer [^\s]+$/.test(authorization)) return res.status(401).json({ error: '로그인이 필요해요.' })
  let body
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body } catch { return res.status(400).json({ error: '입력한 정보를 확인해 주세요.' }) }
  const userId = body?.userId
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (typeof userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: '이메일을 확인해 주세요.' })
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return res.status(503).json({ error: '회원 인증에 연결하지 못했어요.' })
  try {
    const access = await fetcher(`${url.replace(/\/$/, '')}/rest/v1/rpc/admin_global_access`, {
      method: 'POST', headers: { apikey: key, Authorization: authorization, 'Content-Type': 'application/json', 'Content-Profile': env.VITE_SUPABASE_SCHEMA || 'molip_script' }, body: '{}', signal: AbortSignal.timeout(8000),
    })
    if (!access.ok || await access.json() !== true) return res.status(403).json({ error: '접근할 수 없어요.' })
    const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
    if (!secret) return res.status(503).json({ error: '이메일 변경 연결이 준비되지 않았어요.' })
    const client = makeClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetcher(input, { ...init, signal: AbortSignal.timeout(8000) }) } })
    // Do not alter passwords, roles, metadata or manually mark an email verified.
    const { data, error } = await client.auth.admin.updateUserById(userId, { email })
    if (error || data?.user?.email?.toLowerCase() !== email) return res.status(400).json({ error: '이메일을 변경하지 못했어요. 이미 사용 중인 주소인지 확인해 주세요.' })
    return res.status(200).json({ email: data.user.email })
  } catch { return res.status(503).json({ error: '이메일 변경에 실패했어요. 잠시 후 다시 시도해 주세요.' }) }
}
export default function handler(req, res) { return handleMemberEmail(req, res) }
