import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import ts from 'typescript'
const read = path => readFile(new URL(path,import.meta.url),'utf8')
const one='00000000-0000-4000-8000-000000000001', two='00000000-0000-4000-8000-000000000002'
test('email-only profile migration retains identity, supports Korean usernames, and protects personal fields',async()=>{
 const db=new PGlite()
 try {
  for(const path of ['./fixtures/account-schema.sql','./fixtures/account-finalize.sql','../molip-profiles-upgrade.sql','../molip-profiles-finalize-prepare.sql','../molip-profiles-finalize.sql','../sql/admin/member-edit-upgrade.sql']) await db.exec(await read(path))
  const rows=async(sql,params)=>(await db.query(sql,params)).rows
  await db.exec(`insert into molip_script.community_scripts(id,owner_id,owner_login_id) values('shared','${two}','login_two');`)
  await db.exec(`update auth.users set raw_user_meta_data='{}'::jsonb||jsonb_build_object('username','old-email-prefix') where id='${two}'`)
  await db.exec(await read('../sql/accounts/email-username-upgrade.sql'))
  assert.equal((await rows(`select username from molip_profiles.profiles where id='${one}'`))[0].username,'login_one')
  assert.equal((await rows("select count(*)::int n from information_schema.columns where table_schema='molip_profiles' and table_name='profiles' and column_name='login_id'"))[0].n,0)
  assert.equal((await rows("select to_regprocedure('molip_script.email_for_login_id(text)') f"))[0].f,null)
  assert.equal((await rows('select count(*)::int n from molip_script.scripts'))[0].n,1)
  await db.exec(`select set_config('request.jwt.claim.sub','${two}',false);set role authenticated`)
  const profile=(await rows("select molip_script.update_my_profile('한글공부','김학생','010-1234-5678') p"))[0].p
  assert.equal(profile.id,two);assert.equal(profile.username,'한글공부');assert.equal(profile.full_name,'김학생');assert.equal(profile.phone_number,'+821012345678')
  assert.equal(profile.email,'two@example.test')
  await db.query("select molip_script.register_profile('old-client-cannot-rename')")
  assert.equal((await rows('select molip_script.my_profile() p'))[0].p.username,'한글공부')
  await assert.rejects(db.query("select molip_script.update_my_profile('login_one',null,null)"),/unique|duplicate/)
  await assert.rejects(db.query("select molip_script.update_my_profile('bad name',null,null)"),/check constraint/)
  await assert.rejects(db.query("select molip_script.update_my_profile('한글공부',null,'abc')"),/check constraint/)
  await assert.rejects(db.query('select * from molip_profiles.profiles'),/permission denied/)
  await db.exec(`reset role;select set_config('request.jwt.claim.sub','${one}',false);set role authenticated`)
  const own=(await rows('select molip_script.my_profile() p'))[0].p
  assert.equal(own.full_name,null);assert.equal(own.phone_number,null)
  const publicProfile=(await rows(`select * from molip_voca.public_profiles(array['${two}'::uuid])`))[0]
  assert.deepEqual(Object.keys(publicProfile).sort(),['id','username'])
  const detail=(await rows(`select molip_script.admin_member_detail('${two}') p`))[0].p
  assert.equal(detail.full_name,'김학생');assert.equal(detail.phone_number,'+821012345678')
  await db.exec('reset role')
  assert.equal((await rows("select owner_login_id from molip_script.community_scripts where id='shared'"))[0].owner_login_id,'한글공부')
  assert.equal((await rows(`select email from auth.users where id='${two}'`))[0].email,'two@example.test')
  assert.equal((await rows(`select raw_user_meta_data->>'username' old from auth.users where id='${two}'`))[0].old,'old-email-prefix')
  await db.exec(`insert into molip_profiles.admin_grants(user_id,scope) values('${two}','molip-script'); select set_config('request.jwt.claim.sub','${two}',false);set role authenticated`)
  const restricted=(await rows(`select molip_script.admin_member_detail('${two}') p`))[0].p
  assert.equal(restricted.contact_access,false); assert.equal(restricted.full_name,null); assert.equal(restricted.phone_number,null)
  await db.exec('reset role')
  await db.exec(await read('../sql/accounts/email-username-upgrade.sql'))
  assert.equal((await rows(`select username from molip_profiles.profiles where id='${two}'`))[0].username,'한글공부')
  await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values('00000000-0000-4000-8000-000000000099','new@example.test','{"username":"새회원"}');`)
  assert.equal((await rows("select username from molip_profiles.profiles where id='00000000-0000-4000-8000-000000000099'"))[0].username,'새회원')
 } finally {await db.close()}
})
test('username and phone normalization match Korean and international profile entry',async()=>{
 const source=ts.transpileModule(await read('../src/features/account-profile/model/profile.ts'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
 const m=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
 assert.equal(m.validUsername('한글_학생'),true);assert.equal(m.validUsername('ab'),true);assert.equal(m.validUsername('bad name'),false);assert.equal(m.validUsername('_abc'),false)
 assert.equal(m.normalizePhone('010-1234-5678'),'+821012345678');assert.equal(m.validPhone('+1 (415) 555-1212'),true);assert.equal(m.validPhone('123'),false)
 assert.deepEqual(m.missingProfileFields({full_name:null,phone_number:null}),['이름','전화번호'])
})
