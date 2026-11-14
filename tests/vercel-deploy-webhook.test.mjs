import assert from 'node:assert/strict'
import test from 'node:test'
import { createHmac } from 'node:crypto'
import { Readable } from 'node:stream'
import { handleWebhook, createDeliveryCache } from '../api/vercel-deploy-webhook.js'
const env = { MOLIP_VERCEL_WEBHOOK_SECRET:'test-secret', DISCORD_DEPLOY_WEBHOOK_URL:'https://discord.com/api/webhooks/123/test' }
const event = { type:'deployment.succeeded', payload:{target:'production',project:{id:'prj_PiLtRjOBuQB9KqdwBHRvBpBV8rla'},deployment:{id:'dpl_Test123',meta:{githubCommitMessage:'Release: Test @everyone',githubCommitSha:'a'.repeat(40)}}} }
const request = (value=event,secret=env.MOLIP_VERCEL_WEBHOOK_SECRET) => {
 const body = typeof value === 'string' ? value : JSON.stringify(value)
 return Object.assign(Readable.from([Buffer.from(body)]),{method:'POST',headers:{'x-vercel-signature':createHmac('sha1',secret).update(body).digest('hex')}})
}
const response = () => ({code:0,body:null,headers:{},setHeader(key,value){this.headers[key]=value},status(code){this.code=code;return this},json(body){this.body=body;return this}})
const run = async (req,opts={}) => {const res=response();await handleWebhook(req,res,{env,deliverOnce:createDeliveryCache(),...opts});return res}
test('invalid signatures, modified bodies, oversized and malformed payloads cannot send messages',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw new Error('must not call')}
 const unsigned=request();unsigned.headers={}
 assert.equal((await run(unsigned,{fetcher})).code,403)
 assert.equal((await run(request(event,'bad-secret'),{fetcher})).code,403)
 assert.equal((await run(request('x'.repeat(256*1024+1)),{fetcher})).code,413)
 assert.equal((await run(request('{invalid'),{fetcher})).code,400)
 assert.equal((await run(request('null'),{fetcher})).code,400)
 assert.equal(calls,0)
})
test('only successful Production events from the fixed project reach Discord',async()=>{
 let calls=0
 const fetcher=async(url,init)=>{
  calls++;assert.equal(url.hostname,'discord.com');assert.equal(url.searchParams.get('wait'),'true')
  const body=JSON.parse(init.body)
  assert.equal(body.embeds[0].title,'Production 배포 성공');assert.equal(body.embeds[0].fields[0].value,'aaaaaaa')
  assert.deepEqual(body.allowed_mentions,{parse:[]});assert.equal(init.redirect,'error')
  return new Response('{}',{status:200})
 }
 for(const other of [{...event,type:'deployment.error'},{...event,payload:{...event.payload,target:'preview'}},{...event,payload:{...event.payload,project:{id:'prj_other'}}}]) assert.deepEqual((await run(request(other),{fetcher})).body,{ignored:true})
 assert.deepEqual((await run(request(),{fetcher})).body,{delivered:true});assert.equal(calls,1)
})
test('warm instance deduplicates simultaneous and repeated delivery IDs',async()=>{
 const deliverOnce=createDeliveryCache();let calls=0
 const fetcher=async()=>{calls++;return new Response('{}')}
 await Promise.all([run(request(),{deliverOnce,fetcher}),run(request(),{deliverOnce,fetcher})])
 const repeated=await run(request(),{deliverOnce,fetcher})
 assert.deepEqual(repeated.body,{duplicate:true});assert.equal(calls,1)
})
test('Discord failures return retryable errors and do not mark the deployment delivered',async()=>{
 const deliverOnce=createDeliveryCache()
 for(const fetcher of [async()=>new Response('private error',{status:429}),async()=>{throw new Error(env.DISCORD_DEPLOY_WEBHOOK_URL)}]){
  const res=await run(request(),{deliverOnce,fetcher});assert.equal(res.code,503);assert.equal(JSON.stringify(res.body).includes(env.DISCORD_DEPLOY_WEBHOOK_URL),false)
 }
 assert.deepEqual((await run(request(),{deliverOnce,fetcher:async()=>new Response('{}')})).body,{delivered:true})
})
test('missing configuration, untrusted Discord hosts and non-POST requests fail closed',async()=>{
 assert.equal((await run(request(),{env:{}})).code,503)
 assert.equal((await run(request(),{env:{...env,DISCORD_DEPLOY_WEBHOOK_URL:'https://evil.test/webhook'}})).code,503)
 const req=request();req.method='GET';assert.equal((await run(req)).code,405)
})
