import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const read=path=>readFile(new URL(path,import.meta.url),'utf8')
const one='00000000-0000-4000-8000-000000000001',two='00000000-0000-4000-8000-000000000002'
test('only global admins edit contacts and inspect another member private scripts and active learning',async()=>{
 const db=new PGlite()
 try {
  for(const path of ['./fixtures/account-schema.sql','./fixtures/account-finalize.sql','../molip-profiles-upgrade.sql','../molip-profiles-finalize-prepare.sql','../molip-profiles-finalize.sql','../sql/admin/member-edit-upgrade.sql','../sql/accounts/email-username-upgrade.sql','../sql/member-management-upgrade.sql']) await db.exec(await read(path))
  await db.exec(`alter table molip_script.scripts add column title text default 'Script';alter table molip_script.scripts add column raw_text text default '1. 뜻\nEnglish.';alter table molip_script.scripts add column created_at timestamptz default now();alter table molip_script.scripts add column updated_at timestamptz default now();
   alter table molip_script.active_quizzes add column script_id text;alter table molip_script.active_quizzes add column quiz_type text;alter table molip_script.active_quizzes add column mode text;alter table molip_script.active_quizzes add column progress integer;alter table molip_script.active_quizzes add column updated_at timestamptz default now();alter table molip_script.active_quizzes add column state jsonb;
   alter table molip_script.community_scripts add column title text default 'Public script';alter table molip_script.community_scripts add column raw_text text default '1. 뜻\nPublic English.';alter table molip_script.community_scripts add column shared_at timestamptz default now();
   insert into molip_script.community_scripts(id,owner_id) values('public-example','${two}');
   insert into molip_script.scripts(id,owner_id,title) values('other-owner','${one}','Must stay private');
   insert into molip_script.active_quizzes(id,owner_id,script_id,quiz_type,mode,progress,state) values('active','${two}','script-preserved','masking','standard',1,'{"currentIndex":0,"queue":[0],"visibleTokens":[0]}');`)
  const list=kind=>db.query('select molip_script.admin_member_learning($1,$2,0) result',[two,kind])
  const edit=()=>db.query("select molip_script.admin_update_member_profile($1,'한글닉네임','김회원','01012345678',null) result",[two])
  await db.exec(`select set_config('request.jwt.claim.sub','${two}',false);set role authenticated`)
  await assert.rejects(list('scripts'),/Administrator access required/)
  await db.exec(`reset role;insert into molip_profiles.admin_grants(user_id,scope) values('${two}','molip-script');set role authenticated`)
  await assert.rejects(list('active'),/Administrator access required/);await assert.rejects(edit(),/Administrator access required/)
  await db.exec(`reset role;select set_config('request.jwt.claim.sub','${one}',false);set role authenticated`)
  const result=(await edit()).rows[0].result
  assert.equal(result.full_name,'김회원');assert.equal(result.phone_number,'+821012345678');assert.equal(result.email,'two@example.test')
  const scripts=(await list('scripts')).rows[0].result
  assert.equal(scripts.total,1);assert.equal(scripts.items[0].id,'script-preserved')
  const shared=(await list('shared')).rows[0].result
  assert.equal(shared.total,1);assert.equal(shared.items[0].id,'public-example')
  const active=(await list('active')).rows[0].result
  assert.equal(active.items[0].quiz_type,'masking');assert.deepEqual(active.items[0].state.visibleTokens,[0])
  await assert.rejects(db.query("select molip_script.admin_member_learning($1,'scripts',-1)",[two]),/Invalid pagination/)
  await assert.rejects(db.query("select molip_script.admin_update_member_profile($1,'한글닉네임','','',null)",[two]),/required/)
 }finally{await db.close()}
})
