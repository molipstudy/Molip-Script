import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const read=path=>readFile(new URL(path,import.meta.url),'utf8')
const one='00000000-0000-4000-8000-000000000001',two='00000000-0000-4000-8000-000000000002',three='00000000-0000-4000-8000-000000000003'
test('dashboard counts real recent activity, returns bounded summaries and enforces service grants',async()=>{
 const db=new PGlite()
 try {
  for(const path of ['./fixtures/account-schema.sql','./fixtures/account-finalize.sql','../molip-profiles-upgrade.sql','../molip-profiles-finalize-prepare.sql','../molip-profiles-finalize.sql','../sql/support-upgrade.sql'])await db.exec(await read(path))
  await db.exec(`alter table molip_script.scripts add column title text default 'Original';alter table molip_script.scripts add column created_at timestamptz default now();
   update auth.users set created_at=now()-interval '10 days' where id='${two}';
   update molip_script.scripts set created_at=now()-interval '10 days';
   insert into molip_script.scripts(id,owner_id,title) values('new-script','${two}','New script');
   insert into molip_script.active_quizzes(id,owner_id) values('learning','${two}');
   insert into molip_support.threads(user_id,title) values('${two}','Need help');
   insert into molip_support.threads(user_id,title,status) values('${two}','Resolved','answered');
   insert into molip_support.threads(user_id,title,service_key) values('${two}','Other service','molip-voca');`)
  await db.exec(await read('../sql/admin/dashboard-summary-upgrade.sql'))
  const as=async id=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${id}',false);set role authenticated`)
  const summary=async days=>(await db.query('select molip_script.admin_dashboard_summary($1) result',[days])).rows[0].result
  await db.exec('set role anon')
  await assert.rejects(summary(7),/permission denied/)
  await as(two)
  await assert.rejects(summary(7),/Administrator access required/)
  await as(one)
  await assert.rejects(summary(365),/Invalid period/)
  let data=await summary(7)
  assert.equal(data.total_members,3);assert.equal(data.new_members,2);assert.equal(data.previous_new_members,1)
  assert.equal(data.total_scripts,2);assert.equal(data.new_scripts,1);assert.equal(data.waiting_inquiries,1);assert.equal(data.new_inquiries,2)
  assert.equal(data.active_learnings,1);assert.equal(data.daily.reduce((n,row)=>n+row.signups,0),2)
  assert.equal(data.daily.reduce((n,row)=>n+row.scripts,0),1)
  assert.equal(data.recent_scripts[0].id,'new-script');assert.equal(data.recent_inquiries.length,2)
  assert.ok(!JSON.stringify(data).includes('email'));assert.ok(!JSON.stringify(data).includes('Other service'))
  assert.equal((await summary(30)).new_members,3)
  await db.exec(`reset role;delete from molip_profiles.admin_grants where user_id='${one}';insert into molip_profiles.admin_grants(user_id,scope) values('${one}','molip-script');delete from molip_profiles.service_registrations where user_id='${three}' and service_key='molip-script';`)
  await as(one)
  data=await summary(7)
  assert.equal(data.total_members,2);assert.ok(!data.recent_members.some(row=>row.id===three))
  await db.exec(`reset role;update molip_profiles.admin_grants set scope='molip-voca' where user_id='${one}'`)
  await as(one)
  await assert.rejects(summary(7),/Administrator access required/)
 }finally {await db.close()}
})
