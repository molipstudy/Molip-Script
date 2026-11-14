import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
const migration=await readFile(new URL('../molip-profiles-upgrade.sql',import.meta.url),'utf8')
const fixture=await readFile(new URL('./fixtures/account-schema.sql',import.meta.url),'utf8')
const one='00000000-0000-4000-8000-000000000001'
const two='00000000-0000-4000-8000-000000000002'
const three='00000000-0000-4000-8000-000000000003'

test('common account migration preserves identity/FKs, synchronizes old apps and enforces scopes in PostgreSQL',async()=>{
 const db=new PGlite()
 try {
  await db.exec(fixture)
  await db.exec(migration)
  const rows=async sql=>(await db.query(sql)).rows
  assert.equal((await rows('select count(*)::int as n from molip_profiles.profiles'))[0].n,3)
  assert.equal((await rows("select to_regnamespace('molip_admin') as s"))[0].s,null)
  assert.equal((await rows('select scope from molip_profiles.admin_grants'))[0].scope,'global')
  assert.equal((await rows('select name from molip_voca.folders'))[0].name,'Folder retained')
  assert.equal((await rows('select id from molip_script.scripts'))[0].id,'script-preserved')
  assert.equal((await rows(`select username from molip_profiles.profiles where id='${one}'`))[0].username,'Display One')
  await db.exec(`update public.profiles set username='Changed display' where id='${one}'`)
  assert.equal((await rows(`select username from molip_profiles.profiles where id='${one}'`))[0].username,'Changed display')
  await db.exec(`update molip_profiles.profiles set username='Canonical display' where id='${one}'`)
  assert.equal((await rows(`select username from public.profiles where id='${one}'`))[0].username,'Canonical display')
  await assert.rejects(db.exec(`update molip_script.profiles set login_id='stolen' where id='${one}'`),/already registered/)
  await db.exec(`select set_config('request.jwt.claim.sub','${two}',false); set role authenticated;`)
  assert.equal((await rows('select molip_script.admin_access() as allowed'))[0].allowed,false)
  await assert.rejects(db.query('select molip_script.admin_members()'),/Administrator access required/)
  await assert.rejects(db.query(`select molip_script.admin_member_detail('${one}')`),/Administrator access required/)
  await assert.rejects(db.query('select * from molip_profiles.admin_grants'),/permission denied/)
  await assert.rejects(db.query(`insert into molip_profiles.admin_grants(user_id,scope) values('${two}','global')`),/permission denied/)
  assert.equal((await rows('select * from molip_script.account_profile()'))[0].login_id,'login_two')
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','${one}',false); set role authenticated;`)
  assert.equal((await rows('select molip_script.admin_access() as allowed'))[0].allowed,true)
  assert.equal((await rows('select molip_script.admin_members() as result'))[0].result.total_members,3)
  // Removing a grant takes effect immediately, without refreshing the JWT.
  await db.exec(`reset role; delete from molip_profiles.admin_grants where user_id='${one}'; set role authenticated;`)
  assert.equal((await rows('select molip_script.admin_access() as allowed'))[0].allowed,false)
  await db.exec(`reset role; insert into molip_profiles.admin_grants(user_id,scope) values('${one}','molip-script'); set role authenticated;`)
  assert.equal((await rows('select molip_script.admin_members() as result'))[0].result.total_members,2)
  assert.equal((await rows(`select molip_script.admin_member_detail('${three}') as result`))[0].result,null)
  await db.exec('reset role; set role anon;')
  await assert.rejects(db.query('select molip_script.admin_access()'),/permission denied/)
  await assert.rejects(db.query(`select molip_script.register_profile('hack')`),/permission denied/)
  assert.equal((await rows("select molip_script.email_for_login_id('LOGIN_ONE') as email"))[0].email,'one@example.test')
  await db.exec('reset role;')
  // Existing Auth trigger still calls the same application function, with no auth DDL.
  const four='00000000-0000-4000-8000-000000000004'
  await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[four,'four@example.test',{login_id:'login_four',signup_source:'Instagram'}])
  assert.equal((await rows(`select login_id from molip_profiles.profiles where id='${four}'`))[0].login_id,'login_four')
  assert.equal((await rows(`select count(*)::int as n from molip_script.profiles where id='${four}'`))[0].n,0)
  await db.exec(`select set_config('request.jwt.claim.sub','${four}',false); set role authenticated; select molip_script.register_profile('login_four'); select molip_script.register_profile('login_four'); reset role;`)
  assert.equal((await rows(`select email from molip_script.profiles where id='${four}'`))[0].email,'four@example.test')
  await db.exec(`select set_config('request.jwt.claim.sub','${three}',false); set role authenticated;`)
  await assert.rejects(db.query("select molip_script.register_profile('login_two')"),/duplicate key/)
  await db.exec("select molip_script.register_profile('login_three'); reset role;")
  assert.equal((await rows(`select login_id from molip_profiles.profiles where id='${three}'`))[0].login_id,'login_three')
 } finally { await db.close() }
})

test('conflicting legacy identities roll back before modifying profiles or administrator schema',async()=>{
 const db=new PGlite()
 try {
  await db.exec(fixture)
  await db.exec(`insert into public.molip_script_profiles(id,login_id,email) values('${three}','login_one','three@example.test')`)
  await assert.rejects(db.exec(migration),/Conflicting legacy login IDs/)
  await db.exec('rollback;')
  assert.equal((await db.query("select to_regnamespace('molip_profiles') as s")).rows[0].s,null)
  assert.equal((await db.query('select count(*)::int as n from molip_admin.memberships')).rows[0].n,1)
 } finally {await db.close()}
})
