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
    const days = Number(req.query?.days ?? 7)
    if (![1, 7, 30].includes(days)) return res.status(400).json({ error: '조회 기간을 확인해 주세요.' })
    const summary = req.query?.summary === '1'
    const until = now(), since = until - days * 86400000
    const metrics = value => Number.isSafeInteger(value?.visitors) && value.visitors >= 0 && Number.isSafeInteger(value?.pageviews) && value.pageviews >= 0
      ? { visitors: value.visitors, pageviews: value.pageviews } : null
    const query = async (kind, from, end, by, limit = 20) => {
      const url = new URL(`https://api.vercel.com/v1/query/web-analytics/visits/${kind}`)
      url.searchParams.set('projectId', env.MOLIP_VERCEL_PROJECT_ID)
      if (env.MOLIP_VERCEL_TEAM_ID) url.searchParams.set('teamId', env.MOLIP_VERCEL_TEAM_ID)
      url.searchParams.set('since', new Date(from).toISOString())
      url.searchParams.set('until', new Date(end).toISOString())
      if (by) { url.searchParams.set('by', by); url.searchParams.set('limit', String(limit)) }
      const response = await fetcher(url, { headers: { Authorization: `Bearer ${env.MOLIP_VERCEL_ANALYTICS_TOKEN}` }, signal: AbortSignal.timeout(8000) })
      if (!response.ok) return { error: response.status }
      try { return { data: (await response.json()).data } } catch { return { error: 502 } }
    }
    const dimensions = ['requestPath', 'route', 'referrerHostname', 'country', 'deviceType', 'browserName', 'osName', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm']
    const jobs = [
      ['current', () => query('count', since, until)],
      ['recent', () => query('count', until - 86400000, until)],
      ['daily', () => query('aggregate', since, until, 'day', 100)],
      ...(!summary ? [
        ['previous', () => query('count', since - days * 86400000, since)],
        ['hourly', () => query('aggregate', until - 86400000, until, 'hour', 100)],
        ...dimensions.map(by => [by, () => query('aggregate', since, until, by)]),
      ] : []),
    ]
    // Bound parallel requests so adding useful breakdowns does not flood the upstream API.
    const results = {}
    let cursor = 0
    await Promise.all(Array.from({ length: Math.min(5, jobs.length) }, async () => {
      while (cursor < jobs.length) {
        const [name, run] = jobs[cursor++]
        try { results[name] = await run() } catch { results[name] = { error: 503 } }
      }
    }))
    const totals = metrics(results.current?.data)
    if (!totals) return res.status(results.current?.error === 503 ? 503 : 502).json({ error: '방문 통계를 불러오지 못했어요. 연결과 조회 가능한 기간을 확인해 주세요.' })
    const breakdowns = {}
    for (const by of dimensions) {
      const rows = results[by]?.data
      breakdowns[by] = Array.isArray(rows) ? rows.filter(row => metrics(row) && (typeof row[by] === 'string' || row[by] === null)).map(row => ({
        label: typeof row[by] === 'string' ? (by === 'requestPath' || by === 'route' ? row[by].split(/[?#]/)[0] : row[by]).slice(0, 300) : '', ...metrics(row),
      })).sort((a, b) => b.pageviews - a.pageviews).slice(0, 21) : null
    }
    const trend = name => Array.isArray(results[name]?.data) ? results[name].data.filter(row => metrics(row) && typeof row.timestamp === 'string' && Number.isFinite(Date.parse(row.timestamp))).map(row => ({ timestamp: row.timestamp, ...metrics(row) })).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)) : null
    const unavailable = Object.fromEntries(Object.entries(results).filter(([, value]) => value.error).map(([name, value]) => [name, value.error]))
    return res.status(200).json({ connected: true, ...totals, days,
      recent: metrics(results.recent?.data), previous: metrics(results.previous?.data),
      pages: breakdowns.requestPath?.map(row => ({ path: row.label, visitors: row.visitors, pageviews: row.pageviews })) ?? null,
      daily: trend('daily'), hourly: trend('hourly'), breakdowns, unavailable,
      since: new Date(since).toISOString(), until: new Date(until).toISOString() })
  } catch {
    return res.status(503).json({ error: '관리자 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.' })
  }
}
export default function handler(req, res) { return handleAnalytics(req, res) }
