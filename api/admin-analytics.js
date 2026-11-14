// Server-only Vercel Function: never import this module in the client bundle.
export async function handleAnalytics(req, res, { env = process.env, fetcher = fetch, now = Date.now } = {}) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('Vary', 'Authorization')
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }) }
  const authorization = req.headers.authorization
  if (typeof authorization !== 'string' || !/^Bearer [^\s]+$/.test(authorization)) return res.status(401).json({ error: '로그인이 필요합니다.' })
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !key) return res.status(503).json({ error: '회원 인증 연결이 준비되지 않았습니다.' })
  try {
    const access = await fetcher(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/admin_access`, {
      method: 'POST', headers: { apikey: key, Authorization: authorization, 'Content-Type': 'application/json',
        'Content-Profile': env.VITE_SUPABASE_SCHEMA || 'molip_script' },
      body: '{}', signal: AbortSignal.timeout(8000),
    })
    // The RPC validates auth.uid() against private grants on every request.
    if (!access.ok || await access.json() !== true) return res.status(403).json({ error: '접근할 수 없습니다.' })
    if (!env.MOLIP_VERCEL_ANALYTICS_TOKEN || !env.MOLIP_VERCEL_PROJECT_ID) {
      return res.status(200).json({ connected: false, message: '방문 통계가 아직 연결되지 않았습니다.' })
    }
    const until = now()
    const since = until - 7 * 24 * 60 * 60 * 1000
    const url = new URL('https://api.vercel.com/v1/query/web-analytics/visits/count')
    url.searchParams.set('projectId', env.MOLIP_VERCEL_PROJECT_ID)
    if (env.MOLIP_VERCEL_TEAM_ID) url.searchParams.set('teamId', env.MOLIP_VERCEL_TEAM_ID)
    url.searchParams.set('since', new Date(since).toISOString())
    url.searchParams.set('until', new Date(until).toISOString())
    const response = await fetcher(url, { headers: { Authorization: `Bearer ${env.MOLIP_VERCEL_ANALYTICS_TOKEN}` }, signal: AbortSignal.timeout(8000) })
    if (!response.ok) return res.status(502).json({ error: '방문 통계를 불러오지 못했습니다. Vercel 연결과 조회 권한을 확인해 주세요.' })
    const { data } = await response.json()
    if (!Number.isSafeInteger(data?.pageviews) || data.pageviews < 0 || !Number.isSafeInteger(data?.visitors) || data.visitors < 0) {
      return res.status(502).json({ error: '방문 통계 응답을 확인하지 못했습니다.' })
    }
    return res.status(200).json({ connected: true, pageviews: data.pageviews, visitors: data.visitors,
      since: new Date(since).toISOString(), until: new Date(until).toISOString() })
  } catch {
    return res.status(503).json({ error: '관리자 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.' })
  }
}
export default function handler(req, res) { return handleAnalytics(req, res) }
