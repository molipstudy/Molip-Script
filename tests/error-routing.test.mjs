import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
const source=await readFile(new URL('../src/app/lib/routing.ts',import.meta.url),'utf8')
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
const {parseAppPath,pathForScreen}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
test('malformed or extra path segments produce a not-found route, never a truncated home/admin route',()=>{
  for(const path of ['/admin/anything','/auth/anything','/community/people','/community/a/extra','/script/unknown','/script/result','/%E0%A4%A','/%2Fadmin','/%00','/script/flashcard/extra']) {
    assert.deepEqual(parseAppPath(path),{scriptId:null,screen:'not-found'},path)
  }
})
test('existing deep links, trial routes, admin and history navigation remain supported',()=>{
  assert.deepEqual(parseAppPath('/'),{scriptId:null,screen:'home'})
  assert.deepEqual(parseAppPath('/admin'),{scriptId:null,screen:'admin'})
  assert.deepEqual(parseAppPath('/molip-trial/masking'),{scriptId:'molip-trial',screen:'masking'})
  assert.deepEqual(parseAppPath('/legacy-id/result/session-1'),{scriptId:'legacy-id',screen:'result',sessionId:'session-1'})
  assert.deepEqual(parseAppPath('/community/people/user-id'),{scriptId:null,screen:'publisher',publisherId:'user-id'})
  assert.equal(pathForScreen('admin',null),'/admin')
  assert.equal(parseAppPath('/404').screen,'not-found')
  assert.equal(parseAppPath('/403').screen,'forbidden')
})
test('SPA rewrite preserves all API paths for real HTTP error responses',async()=>{
  const {rewrites}=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'))
  const match=new RegExp(`^${rewrites[0].source}$`)
  assert.equal(match.test('/admin'),true)
  assert.equal(match.test('/script-id/flashcard'),true)
  assert.equal(match.test('/api/admin-analytics'),false)
  assert.equal(match.test('/api/anything'),false)
  assert.equal(match.test('/api'),false)
})

test('admin member details have a strict UUID route and round trip', () => {
 const id = 'ffe7a16b-36eb-4c3a-94b5-60a59ce079c3'
 assert.deepEqual(parseAppPath(`/admin/members/${id}`), {scriptId:null,screen:'admin',adminMemberId:id})
 assert.equal(pathForScreen('admin', null, null, null, null, id), `/admin/members/${id}`)
 for (const path of ['/admin/members', '/admin/members/no-id', `/admin/members/${id}/edit`]) assert.equal(parseAppPath(path).screen, 'not-found')
})

test('support and administrator inbox have distinct routes',()=>{
 assert.equal(parseAppPath('/support').screen,'support')
 assert.equal(parseAppPath('/admin/support').screen,'admin-support')
 assert.equal(parseAppPath('/admin/support/extra').screen,'not-found')
 assert.equal(pathForScreen('support',null),'/support')
 assert.equal(pathForScreen('admin-support',null),'/admin/support')
})
