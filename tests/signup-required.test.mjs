import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import ts from 'typescript'
const read = path => readFile(new URL(path,import.meta.url),'utf8')
const one='00000000-0000-4000-8000-000000000001', two='00000000-0000-4000-8000-000000000002', fresh='00000000-0000-4000-8000-000000000009'

test('signup requires all contact fields, stores them before confirmation, and filled profiles cannot be cleared',async()=>{
 const db=new PGlite()
 try {
  for(const path of ['./fixtures/account-schema.sql','./fixtures/account-finalize.sql','../molip-profiles-upgrade.sql','../molip-profiles-finalize-prepare.sql','../molip-profiles-finalize.sql','../sql/admin/member-edit-upgrade.sql','../sql/accounts/email-username-upgrade.sql','../sql/member-management-upgrade.sql']) await db.exec(await read(path))
  const signup={signup_service:'molip-script',username:'새회원',full_name:'김회원',phone_number:'010-1234-5678',signup_source:'커뮤니티'}
  const insert=meta=>db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[fresh,'fresh@example.test',meta])
  for(const key of ['username','full_name','phone_number','signup_source']) { const meta={...signup};delete meta[key];await assert.rejects(insert(meta),/Signup information required/) }
  await assert.rejects(insert({...signup,phone_number:'abc'}),/Signup information required/)
  await insert(signup)
  const profile=(await db.query('select full_name,phone_number from molip_profiles.profiles where id=$1',[fresh])).rows[0]
  assert.deepEqual(profile,{full_name:'김회원',phone_number:'+821012345678'})
  await assert.rejects(db.query('update molip_profiles.profiles set full_name=null where id=$1',[fresh]),/cannot be cleared/)
  await db.exec(`select set_config('request.jwt.claim.sub','${fresh}',false);set role authenticated`)
  await assert.rejects(db.query("select molip_script.update_my_profile('새회원',null,null)"),/required/)
  await db.query("select molip_script.update_my_profile('수정회원','김수정','01098765432')")
  await assert.rejects(db.query("select molip_script.update_my_profile('수정회원','김수정','')"),/required/)
  await db.exec(`reset role;select set_config('request.jwt.claim.sub','${two}',false);set role authenticated`)
  await assert.rejects(db.query("select molip_script.update_my_profile('기존회원',null,null)"),/required/)
  await db.exec(`reset role`)
  // Legacy accounts retain UUIDs and missing details until members supply them.
  assert.equal((await db.query('select full_name from molip_profiles.profiles where id=$1',[one])).rows[0].full_name,null)
 } finally {await db.close()}
})

test('signup validation rejects missing fields, whitespace names and malformed contacts',async()=>{
 const source=await read('../src/features/account-profile/model/profile.ts')
 const {signupDetailsError}=await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64')}`)
 const good={fullName:'김회원',phoneNumber:'01012345678',signupSource:'Instagram'}
 assert.equal(signupDetailsError(good),'')
 assert.equal(signupDetailsError({...good,signupSource:'기타',signupSourceOther:'학교 게시판'}),'')
 assert.ok(signupDetailsError({...good,signupSource:'기타',signupSourceOther:' '}))
 assert.ok(signupDetailsError({...good,signupSource:'기타',signupSourceOther:'x'.repeat(121)}))
 for(const invalid of [undefined,{...good,fullName:' '},{...good,fullName:'x\ny'},{...good,phoneNumber:''},{...good,phoneNumber:'123'},{...good,signupSource:''}]) assert.ok(signupDetailsError(invalid))
})
