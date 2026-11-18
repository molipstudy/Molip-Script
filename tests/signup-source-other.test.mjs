import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
import {PGlite} from '@electric-sql/pglite'
const read=path=>readFile(new URL(path,import.meta.url),'utf8')
const one='00000000-0000-4000-8000-000000000001',fresh='00000000-0000-4000-8000-000000000009'
test('Other source persists the separate description and admin filtering/editing preserve it',async()=>{
 const db=new PGlite()
 try{
  for(const path of ['./fixtures/account-schema.sql','./fixtures/account-finalize.sql','../molip-profiles-upgrade.sql','../molip-profiles-finalize-prepare.sql','../molip-profiles-finalize.sql','../sql/admin/member-edit-upgrade.sql','../sql/accounts/email-username-upgrade.sql','../sql/member-management-upgrade.sql','../sql/signup-source-other-upgrade.sql'])await db.exec(await read(path))
  const signup={signup_service:'molip-script',username:'기타회원',full_name:'김회원',phone_number:'01012345678',signup_source:'기타'}
  const insert=meta=>db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[fresh,'other@example.test',meta])
  await assert.rejects(insert(signup),/Other signup source detail required/)
  await assert.rejects(insert({...signup,signup_source_detail:' '}),/Other signup source detail required/)
  await insert({...signup,signup_source_detail:' 학교 게시판 '})
  await db.exec(`select set_config('request.jwt.claim.sub','${fresh}',false);set role authenticated`)
  await db.query("select molip_script.register_profile('')")
  await db.exec('reset role')
  const event=(await db.query("select description from molip_notifications.events where event_key=$1",['signup:'+fresh])).rows[0]
  assert.ok(event.description.includes('학교 게시판'))
  await db.exec(`select set_config('request.jwt.claim.sub','${one}',false);set role authenticated`)
  const rows=async(sql,params)=>(await db.query(sql,params)).rows[0].result
  const list=await rows("select molip_script.admin_members('',0,'기타') result")
  assert.equal(list.total,1);assert.equal(list.items[0].signup_source_detail,'학교 게시판')
  const detail=await rows('select molip_script.admin_member_detail($1) result',[fresh])
  assert.equal(detail.signup_source_detail,'학교 게시판')
  await assert.rejects(db.query("select molip_script.admin_update_member_profile($1,'기타회원','김회원','01012345678','기타','')",[fresh]),/Other signup source detail required/)
  const edited=await rows("select molip_script.admin_update_member_profile($1,'기타회원','김회원','01012345678','기타','친구 블로그') result",[fresh])
  assert.equal(edited.signup_source_detail,'친구 블로그')
  const standard=await rows("select molip_script.admin_update_member_profile($1,'기타회원','김회원','01012345678','커뮤니티',null) result",[fresh])
  assert.equal(standard.signup_source_detail,null)
  await assert.rejects(db.query("select molip_script.admin_members('',0,'unknown')"),/Invalid member filters/)
 }finally{await db.close()}
})
