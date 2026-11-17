import assert from 'node:assert/strict'
import test from 'node:test'
import { handleMemberEmail } from '../api/admin-member-email.js'
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public-key',SUPABASE_SECRET_KEY:'server-only-secret'}
const userId='00000000-0000-4000-8000-000000000002'
const request=()=>({method:'POST',headers:{authorization:'Bearer user-token'},body:{userId,email:' NEW@Example.test ',password:'never-forward',role:'admin',email_confirm:true}})
const response=()=>({code:200,headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(body){this.body=body;return this}})
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status})

test('anonymous and non-global admins cannot instantiate a privileged Auth client',async()=>{
 for(const scenario of ['anonymous','ordinary','expired','spoofed']){
  const req=request(),res=response()
  if(scenario==='anonymous')req.headers={}
  await handleMemberEmail(req,res,{env,fetcher:async(url,options)=>{
   assert.ok(url.endsWith('/rpc/admin_global_access'));assert.equal(options.headers.Authorization,'Bearer user-token')
   return scenario==='expired'?reply({},401):reply(scenario==='spoofed'?'true':false)
  },makeClient:()=>assert.fail('Privileged client must not be created')})
  assert.ok([401,403].includes(res.code));assert.ok(!JSON.stringify(res.body).includes('secret'))
 }
})
test('global admins update only the requested Auth email without changing passwords or verification flags',async()=>{
 const res=response()
 await handleMemberEmail(request(),res,{env,fetcher:async()=>reply(true),makeClient:(url,key,options)=>{
  assert.equal(key,'server-only-secret');assert.equal(options.auth.persistSession,false)
  return {auth:{admin:{updateUserById:async(id,attributes)=>{
   assert.equal(id,userId);assert.deepEqual(attributes,{email:'new@example.test'})
   return {data:{user:{id,email:attributes.email,other:'not-forwarded'}},error:null}
  }}}}
 }})
 assert.equal(res.code,200);assert.deepEqual(res.body,{email:'new@example.test'});assert.equal(res.headers['Cache-Control'],'private, no-store')
})
test('bad methods, invalid body, missing server keys and Auth errors fail safely',async()=>{
 for(const scenario of ['method','body','missing','auth-failure']){
  const req=request(),res=response()
  if(scenario==='method')req.method='GET'
  if(scenario==='body')req.body='{'
  await handleMemberEmail(req,res,{env:scenario==='missing'?{...env,SUPABASE_SECRET_KEY:''}:env,fetcher:async()=>reply(true),makeClient:()=>({auth:{admin:{updateUserById:async()=>({error:{message:'server-only-secret'},data:null})}}})})
  assert.ok(res.code>=400);assert.ok(!JSON.stringify(res.body).includes('secret'))
 }
})
