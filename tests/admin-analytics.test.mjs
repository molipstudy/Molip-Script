import assert from 'node:assert/strict'
import test from 'node:test'
import { handleAnalytics } from '../api/admin-analytics.js'
const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'public-key', MOLIP_VERCEL_ANALYTICS_TOKEN: 'server-secret', MOLIP_VERCEL_PROJECT_ID: 'project', MOLIP_VERCEL_TEAM_ID: 'team' }
const response = () => ({ code: 200, headers: {}, setHeader(key,value) { this.headers[key]=value }, status(code) { this.code=code; return this }, json(body) { this.body=body; return this } })
const request = () => ({ method:'GET', headers:{ authorization:'Bearer user-token' } })
const reply = (body, status=200) => new Response(JSON.stringify(body), { status })

test('anonymous, ordinary, expired and forged access cannot reach the Vercel token', async () => {
  let calls=0
  for (const req of [{method:'GET',headers:{}}, request(), request(), request()]) {
    const res=response()
    await handleAnalytics(req,res,{env,fetcher:async url => {calls++; assert.ok(String(url).startsWith(env.SUPABASE_URL)); return calls===1 ? reply(false) : calls===2 ? reply({},401) : reply('true') }})
    assert.ok([401,403].includes(res.code))
    assert.equal(res.headers['Cache-Control'],'private, no-store')
  }
  assert.equal(calls,3)
})
test('authorized administrator receives only real numeric totals for the fixed project and period', async () => {
  let calls=0
  const res=response()
  const now=Date.UTC(2026,10,14)
  await handleAnalytics(request(),res,{env,now:()=>now,fetcher:async (url,options) => {
    calls++
    if (calls===1) {
      assert.equal(options.headers.Authorization,'Bearer user-token')
      assert.equal(options.headers['Content-Profile'],'molip_script')
      return reply(true)
    }
    assert.equal(url.origin,'https://api.vercel.com')
    assert.equal(url.searchParams.get('projectId'),'project')
    assert.equal(url.searchParams.get('teamId'),'team')
    assert.ok([86400000,7*86400000].includes(Date.parse(url.searchParams.get('until'))-Date.parse(url.searchParams.get('since'))))
    assert.equal(options.headers.Authorization,'Bearer server-secret')
    const by = url.searchParams.get('by')
    assert.ok(by === null || ['requestPath', 'day'].includes(by))
    if (by === 'requestPath') return reply({data:[{requestPath:'/community?token=private',visitors:3,pageviews:8,secret:'not-forwarded'}]})
    if (by === 'day') return reply({data:[{timestamp:'2026-11-13T00:00:00Z',visitors:4,pageviews:9,secret:'not-forwarded'}]})
    return reply({data:{visitors:13,pageviews:22,secret:'not-forwarded'}})
  }})
  assert.equal(res.code,200)
  assert.equal(res.body.visitors,13)
  assert.equal(res.body.pageviews,22)
  assert.ok(!JSON.stringify(res.body).includes('secret'))
  assert.equal(calls,5)
  assert.deepEqual(res.body.pages,[{path:'/community',visitors:3,pageviews:8}])
  assert.equal(res.body.daily[0].visitors,4)
  assert.equal(res.body.recent.visitors,13)
  assert.ok(!JSON.stringify(res.body).includes('private'))
})
test('missing integration, upstream failures and malformed totals never fabricate a zero', async () => {
  for (const scenario of ['missing','failed','malformed','network']) {
    let calls=0
    const res=response()
    await handleAnalytics(request(),res,{env: scenario==='missing' ? {...env,MOLIP_VERCEL_ANALYTICS_TOKEN:''}:env,fetcher:async () => {
      if (++calls===1) return reply(true)
      if (scenario==='network') throw new Error('secret response')
      return scenario==='failed' ? reply({error:'secret'},403) : reply({data:{visitors:null,pageviews:0}})
    }})
    assert.equal(res.body.visitors,undefined)
    assert.ok(!JSON.stringify(res.body).includes('secret'))
    assert.equal(res.code,scenario==='missing'?200:scenario==='network'?503:502)
  }
})
test('writes are rejected without any remote request', async () => {
  const res=response()
  await handleAnalytics({...request(),method:'POST'},res,{env,fetcher:()=>assert.fail('must not call')})
  assert.equal(res.code,405)
})

test('optional aggregate failures preserve totals without manufacturing empty datasets', async () => {
 const res=response()
 await handleAnalytics(request(),res,{env,fetcher:async url => {
  if (String(url).startsWith(env.SUPABASE_URL)) return reply(true)
  return url.pathname.endsWith('/count') ? reply({data:{visitors:2,pageviews:5}}) : reply({},403)
 }})
 assert.equal(res.code,200)
 assert.equal(res.body.visitors,2)
 assert.equal(res.body.pages,null)
 assert.equal(res.body.daily,null)
})
