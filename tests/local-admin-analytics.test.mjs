import test from 'node:test'
import assert from 'node:assert/strict'
import { localAdminAnalytics } from '../scripts/dev/admin-analytics.mjs'
import { handleAnalytics } from '../api/admin-analytics.js'
const env = { SUPABASE_URL:'https://example.supabase.co', SUPABASE_ANON_KEY:'public-key', MOLIP_VERCEL_ANALYTICS_TOKEN:'private-server-token', MOLIP_VERCEL_PROJECT_ID:'project' }
function middleware(handler) {
 let run
 localAdminAnalytics(env, handler).configureServer({middlewares:{use(value){run=value}}})
 return run
}
const response=()=>({headers:{},statusCode:200,setHeader(key,value){this.headers[key]=value},end(body){this.body=JSON.parse(body);this.writableEnded=true}})
test('local analytics routes return production JSON errors instead of the SPA document',async()=>{
 const run=middleware()
 const res=response()
 await run({url:'/api/admin-analytics?days=7',method:'GET',headers:{}},res,()=>assert.fail('API must not fall through'))
 assert.equal(res.statusCode,401);assert.equal(res.headers['Content-Type'],'application/json; charset=utf-8')
 assert.equal(res.headers['Cache-Control'],'private, no-store')
 let next=false
 await run({url:'/api/admin-analytics-extra',headers:{}},response(),()=>{next=true})
 assert.equal(next,true)
})
test('local analytics passes range and session to the real handler with server-only credentials',async()=>{
 let requests=0
 const run=middleware((req,res,options)=>handleAnalytics(req,res,{...options,fetcher:async(url,init)=>{
  requests++
  if(String(url).startsWith(env.SUPABASE_URL)){assert.equal(init.headers.Authorization,'Bearer user-token');return Response.json(true)}
  assert.equal(init.headers.Authorization,'Bearer private-server-token')
  assert.equal(Date.parse(url.searchParams.get('until'))-Date.parse(url.searchParams.get('since')),86400000)
  return Response.json({data:url.searchParams.has('by')?[]:{visitors:12,pageviews:30}})
 }}))
 const res=response()
 await run({url:'/api/admin-analytics?summary=1&days=1',method:'GET',headers:{authorization:'Bearer user-token'}},res,()=>assert.fail())
 assert.equal(requests,4);assert.equal(res.statusCode,200);assert.equal(res.body.visitors,12)
 assert.ok(!JSON.stringify(res.body).includes('private-server-token'))
})

test('local development status API uses the same administrator auth boundary',async()=>{
 const res=response()
 await middleware()({url:'/api/admin-development',method:'GET',headers:{}},res,()=>assert.fail('development API must not fall through to HTML'))
 assert.equal(res.statusCode,401);assert.equal(res.headers['Content-Type'],'application/json; charset=utf-8')
})
