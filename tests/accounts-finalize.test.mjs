import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const read=path=>readFile(new URL(path,import.meta.url),'utf8')
const initial=await read('./fixtures/account-schema.sql')
const extra=await read('./fixtures/account-finalize.sql')
const stage1=await read('../molip-profiles-upgrade.sql')
const prepare=await read('../molip-profiles-finalize-prepare.sql')
const finalize=await read('../molip-profiles-finalize.sql')
const one='00000000-0000-4000-8000-000000000001'
const two='00000000-0000-4000-8000-000000000002'
const three='00000000-0000-4000-8000-000000000003'
const voca='00000000-0000-4000-8000-000000000021'

test('single-profile cutover removes copies, preserves learning and Voca FKs, and supports both apps securely',async()=>{
 const db=new PGlite()
 try {
  const rows=async sql=>(await db.query(sql)).rows
  await db.exec(initial+extra)
  await db.exec(stage1)
  await db.exec(prepare)
  // New APIs already work before old endpoints are removed, allowing staged deployment.
  await db.exec(`select set_config('request.jwt.claim.sub','${one}',false); set role authenticated;`)
  assert.equal((await rows('select molip_voca.account_profile() as p'))[0].p.username,'Display One')
  await db.exec("select molip_voca.update_account_profile('Unified name',null); reset role;")
  assert.equal((await rows(`select username from public.profiles where id='${one}'`))[0].username,'Unified name')
  await db.exec(finalize)
  for(const table of ['public.profiles','public.molip_script_profiles','molip_script.profiles']) assert.equal((await rows(`select to_regclass('${table}') as t`))[0].t,null)
  assert.equal((await rows('select count(*)::int as n from molip_profiles.profiles'))[0].n,3)
  assert.equal((await rows('select count(*)::int as n from molip_voca.folders'))[0].n,1)
  assert.equal((await rows("select count(*)::int as n from pg_constraint where contype='f' and confrelid='molip_profiles.profiles'::regclass and connamespace='molip_voca'::regnamespace"))[0].n,5)
  assert.equal((await rows('select id from molip_script.scripts'))[0].id,'script-preserved')
  assert.equal((await rows('select count(*)::int as n from molip_notifications.events'))[0].n,0)
  await db.exec(`select set_config('request.jwt.claim.sub','${one}',false); set role authenticated;`)
  assert.equal((await rows('select molip_script.admin_members() as p'))[0].p.total_members,3)
  assert.equal((await rows('select molip_voca.account_profile() as p'))[0].p.email,'one@example.test')
  assert.equal((await rows("select molip_voca.update_account_profile('After cutover',null) as p"))[0].p.username,'After cutover')
  assert.equal((await rows(`select * from molip_voca.collaborator_profiles('${voca}')`)).length,1)
  assert.equal((await rows(`select molip_voca.find_collaborator('${voca}','two@example.test') as id`))[0].id,two)
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','${two}',false); set role authenticated;`)
  await assert.rejects(db.query(`select molip_voca.find_collaborator('${voca}','one@example.test')`),/Access denied/)
  const own=(await rows(`select * from molip_voca.collaborator_profiles('${voca}')`))
  assert.equal(own.length,1); assert.equal(own[0].user_id,two)
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','${three}',false); set role authenticated;`)
  assert.equal((await rows(`select * from molip_voca.collaborator_profiles('${voca}')`)).length,0)
  await assert.rejects(db.query('select * from molip_profiles.profiles'),/permission denied/)
  await db.exec('reset role; set role anon;')
  const publicData=await rows(`select * from molip_voca.public_profiles(array['${one}'::uuid])`)
  assert.deepEqual(Object.keys(publicData[0]),['id','username'])
  await assert.rejects(db.query('select molip_voca.account_profile()'),/permission denied/)
  await db.exec('reset role;')
  const four='00000000-0000-4000-8000-000000000004'
  await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[four,'four@example.test',{login_id:'login_four',signup_service:'molip-script',signup_source:'Instagram'}])
  assert.equal((await rows('select count(*)::int as n from molip_profiles.profiles'))[0].n,4)
  await db.exec(`select set_config('request.jwt.claim.sub','${four}',false); set role authenticated; select molip_script.register_profile('login_four'); select molip_script.register_profile('login_four'); reset role;`)
  assert.equal((await rows(`select signup_source from molip_profiles.service_registrations where user_id='${four}'`))[0].signup_source,'Instagram')
  assert.equal((await rows('select count(*)::int as n from molip_notifications.events'))[0].n,1)
  const notification=(await rows('select description from molip_notifications.events'))[0].description
  assert.ok(notification.includes('\n이메일:'))
  for(const table of ['public.profiles','public.molip_script_profiles','molip_script.profiles']) assert.equal((await rows(`select to_regclass('${table}') as t`))[0].t,null)
 } finally {await db.close()}
})
