import assert from 'node:assert/strict'
import test from 'node:test'
import { handleDevelopment } from '../api/admin-development.js'
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public-key',MOLIP_VERCEL_ANALYTICS_TOKEN:'vercel-secret',MOLIP_VERCEL_PROJECT_ID:'fixed-project',MOLIP_VERCEL_TEAM_ID:'fixed-team',MOLIP_GITHUB_READ_TOKEN:'github-secret'}
const request=()=>({method:'GET',headers:{authorization:'Bearer user-session'}})
const response=()=>({code:200,headers:{},setHeader(key,value){this.headers[key]=value},status(code){this.code=code;return this},json(body){this.body=body;return this}})
const sha='a'.repeat(40),nextSha='b'.repeat(40)
const current={id:'dpl_current',readyState:'READY',createdAt:Date.UTC(2026,10,20),meta:{githubCommitSha:sha,githubCommitMessage:'Current production\nprivate description',secret:'never returned'},env:[{value:'secret'}]}
const latest={uid:'dpl_latest',readyState:'ERROR',created:Date.UTC(2026,10,20),meta:{githubCommitSha:nextSha,githubCommitMessage:'Failed attempt'}}
const commits=[{sha:nextSha,html_url:'javascript:evil()',author:{login:'author'},commit:{message:'Next commit\nprivate body',author:{name:'Person',email:'private@example.test'},committer:{date:'2026-11-20T00:00:00Z'}}}]
const reply=(data,status=200)=>Response.json(data,{status})
test('anonymous, expired, ordinary and forged admin access never reaches either integration',async()=>{
 for(const scenario of ['anonymous','denied','expired','forged','network']){
  let calls=0;const res=response()
  await handleDevelopment(scenario==='anonymous'?{method:'GET',headers:{}}:request(),res,{env,fetcher:async url=>{calls++;assert.ok(String(url).startsWith(env.SUPABASE_URL));if(scenario==='network')throw new Error('secret');return scenario==='expired'?reply({},401):reply(scenario==='forged'?'true':false)}})
  assert.equal(calls,scenario==='anonymous'?0:1)
  assert.ok([401,403,503].includes(res.code));assert.equal(res.headers['Cache-Control'],'private, no-store')
 }
 const res=response()
 await handleDevelopment({...request(),method:'POST'},res,{env,fetcher:()=>assert.fail()})
 assert.equal(res.code,405)
})
test('fixed project and repository reads preserve current production despite a newer failed attempt',async()=>{
 const res=response();let calls=0
 await handleDevelopment({...request(),query:{projectId:'attacker',repo:'other'}},res,{env,now:()=>Date.UTC(2026,10,20),fetcher:async(url,options)=>{
  calls++
  if(String(url).startsWith(env.SUPABASE_URL)){assert.equal(options.headers.Authorization,'Bearer user-session');return reply(true)}
  const parsed=new URL(url)
  if(parsed.hostname==='api.github.com'){
   assert.equal(options.headers.Authorization,'Bearer github-secret');assert.equal(parsed.pathname,'/repos/molipstudy/Molip-Script/commits');assert.equal(parsed.searchParams.get('sha'),'main');assert.equal(parsed.searchParams.get('per_page'),'20');return reply(commits)
  }
  assert.equal(parsed.hostname,'api.vercel.com');assert.equal(options.headers.Authorization,'Bearer vercel-secret');assert.equal(parsed.searchParams.get('teamId'),'fixed-team')
  if(parsed.pathname.startsWith('/v9/projects/')){assert.equal(parsed.pathname,'/v9/projects/fixed-project');return reply({id:'fixed-project',targets:{production:current},env:[{value:'secret'}]})}
  assert.equal(parsed.searchParams.get('projectId'),'fixed-project');assert.equal(parsed.searchParams.get('target'),'production');assert.equal(parsed.searchParams.get('limit'),'1');return reply({deployments:[latest]})
 }})
 assert.equal(res.code,200);assert.equal(calls,4)
 assert.equal(res.body.vercel.current.id,'dpl_current');assert.equal(res.body.vercel.current.state,'READY')
 assert.equal(res.body.vercel.latest.state,'ERROR');assert.equal(res.body.github.commits[0].sha,nextSha)
 assert.equal(res.body.github.commits[0].message,'Next commit');assert.equal(res.body.github.commits[0].url,`https://github.com/molipstudy/Molip-Script/commit/${nextSha}`)
 for(const hidden of ['secret','private@example','private body','javascript:'])assert.ok(!JSON.stringify(res.body).includes(hidden))
})
test('provider failures remain separate from failed deployments or valid empty results',async()=>{
 for(const scenario of ['github','vercel','missing','empty','malformed']){
  const res=response()
  await handleDevelopment(request(),res,{env:scenario==='missing'?{...env,MOLIP_VERCEL_ANALYTICS_TOKEN:''}:env,fetcher:async url=>{
   const str=String(url)
   if(str.startsWith(env.SUPABASE_URL))return reply(true)
   if(str.startsWith('https://api.github.com'))return scenario==='github'?reply({message:'secret'},403):reply(commits)
   if(scenario==='missing')assert.fail('missing credentials must not trigger Vercel requests')
   if(scenario==='vercel')throw new Error('secret details')
   if(scenario==='malformed')return reply(null)
   return str.includes('/v9/projects/')?reply({id:'fixed-project',targets:{}}):reply({deployments:[]})
  }})
  assert.equal(res.code,200)
  assert.equal(res.body.github.available,scenario!=='github')
  assert.equal(res.body.vercel.currentAvailable,['github','empty'].includes(scenario))
  assert.equal(res.body.vercel.latestAvailable,['github','empty'].includes(scenario))
  assert.equal(res.body.vercel.current,null)
  assert.ok(!JSON.stringify(res.body).includes('secret'))
 }
})
test('malformed links, commits and unrecognized states are sanitized and public GitHub needs no token',async()=>{
 const res=response()
 await handleDevelopment(request(),res,{env:{...env,MOLIP_GITHUB_READ_TOKEN:''},fetcher:async(url,options)=>{
  if(String(url).startsWith(env.SUPABASE_URL))return reply(true)
  if(String(url).startsWith('https://api.github.com')){assert.equal(options.headers.Authorization,undefined);return reply([{sha:'evil'}, {sha:[sha]},...commits])}
  return String(url).includes('/v9/projects/')?reply({id:'fixed-project',targets:{production:{...current,readyState:'unrecognized',url:'javascript:bad',createdAt:'invalid'}}}):reply({deployments:[]})
 }})
 assert.equal(res.body.github.commits.length,1)
 assert.equal(res.body.vercel.current.state,'UNKNOWN');assert.equal(res.body.vercel.current.createdAt,null)
 assert.equal(res.body.vercel.current.url,'https://vercel.com/z1hxn/molip-script/dpl_current')
})
