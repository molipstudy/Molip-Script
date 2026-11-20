// Server-only, read-only integrations. Do not import into the client bundle.
const repository = 'https://github.com/molipstudy/Molip-Script'
const shaPattern = /^[a-f0-9]{40,64}$/i
const validSha = value => typeof value === 'string' && shaPattern.test(value)
const states = new Set(['READY', 'ERROR', 'CANCELED', 'BUILDING', 'QUEUED', 'INITIALIZING', 'BLOCKED'])
const text = (value, max = 200) => typeof value === 'string' ? value.slice(0, max) : ''
const timestamp = value => {
  const parsed = typeof value === 'number' || typeof value === 'string' ? new Date(value) : null
  return parsed && Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null
}
function deployment(value) {
  const id = value?.id || value?.uid
  if (typeof id !== 'string' || !/^[\w-]{1,128}$/.test(id)) return null
  const state = value.readyState || value.state
  const sha = validSha(value.meta?.githubCommitSha) ? value.meta.githubCommitSha : null
  return {
    id, state: states.has(state) ? state : 'UNKNOWN',
    createdAt: timestamp(value.createdAt ?? value.created),
    commit: sha ? { sha, message: text(value.meta?.githubCommitMessage).split('\n')[0], url: `${repository}/commit/${sha}` } : null,
    url: `https://vercel.com/z1hxn/molip-script/${encodeURIComponent(id)}`,
  }
}
export async function handleDevelopment(req, res, { env = process.env, fetcher = fetch, now = Date.now } = {}) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('Vary', 'Authorization')
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }) }
  const authorization = req.headers.authorization
  if (typeof authorization !== 'string' || !/^Bearer [^\s]+$/.test(authorization)) return res.status(401).json({ error: '로그인이 필요합니다.' })
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !key) return res.status(503).json({ error: '회원 인증 연결이 준비되지 않았어요.' })
  try {
    const access = await fetcher(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/admin_access`, {
      method: 'POST', headers: { apikey: key, Authorization: authorization, 'Content-Type': 'application/json', 'Content-Profile': env.VITE_SUPABASE_SCHEMA || 'molip_script' },
      body: '{}', signal: AbortSignal.timeout(8000),
    })
    if (!access.ok || await access.json() !== true) return res.status(403).json({ error: '접근할 수 없습니다.' })
  } catch { return res.status(503).json({ error: '관리자 권한을 확인하지 못했어요.' }) }

  const get = async (url, headers) => {
    const response = await fetcher(url, { headers, signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error('Upstream unavailable')
    return response.json()
  }
  const token = env.MOLIP_VERCEL_TOKEN || env.MOLIP_VERCEL_ANALYTICS_TOKEN
  const configured = Boolean(token && env.MOLIP_VERCEL_PROJECT_ID)
  const vercel = async path => {
    if (!configured) throw new Error('Not configured')
    const url = new URL(path, 'https://api.vercel.com')
    if (env.MOLIP_VERCEL_TEAM_ID) url.searchParams.set('teamId', env.MOLIP_VERCEL_TEAM_ID)
    return get(url, { Authorization: `Bearer ${token}` })
  }
  const githubHeaders = { Accept: 'application/vnd.github+json', 'User-Agent': 'Molip-Script', 'X-GitHub-Api-Version': '2022-11-28' }
  if (env.MOLIP_GITHUB_READ_TOKEN) githubHeaders.Authorization = `Bearer ${env.MOLIP_GITHUB_READ_TOKEN}`
  const [project, latest, history] = await Promise.allSettled([
    vercel(`/v9/projects/${encodeURIComponent(env.MOLIP_VERCEL_PROJECT_ID || '')}`),
    vercel(`/v7/deployments?projectId=${encodeURIComponent(env.MOLIP_VERCEL_PROJECT_ID || '')}&target=production&limit=1`),
    get('https://api.github.com/repos/molipstudy/Molip-Script/commits?sha=main&per_page=20', githubHeaders),
  ])
  const currentValue = project.status === 'fulfilled' ? project.value?.targets?.production : undefined
  const latestValue = latest.status === 'fulfilled' && Array.isArray(latest.value?.deployments) ? latest.value?.deployments[0] : undefined
  const current = deployment(currentValue), attempt = deployment(latestValue)
  // null is a legitimate "no deployment yet" only after a valid project/list response.
  const currentAvailable = project.status === 'fulfilled' && typeof project.value?.id === 'string' && (!currentValue || Boolean(current))
  const latestAvailable = latest.status === 'fulfilled' && Array.isArray(latest.value?.deployments) && (!latestValue || Boolean(attempt))
  const commitsAvailable = history.status === 'fulfilled' && Array.isArray(history.value)
  const commits = commitsAvailable ? history.value.filter(row => validSha(row?.sha)).slice(0, 20).map(row => ({
    sha: row.sha, message: text(row.commit?.message).split('\n')[0], author: text(row.author?.login || row.commit?.author?.name, 80),
    createdAt: timestamp(row.commit?.committer?.date || row.commit?.author?.date), url: `${repository}/commit/${row.sha}`,
  })) : null
  return res.status(200).json({
    checkedAt: new Date(now()).toISOString(),
    vercel: { configured, currentAvailable, latestAvailable, current, latest: attempt },
    github: { available: commitsAvailable, commits },
  })
}
export default function handler(req, res) { return handleDevelopment(req, res) }
