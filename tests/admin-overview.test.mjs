import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
test('signup aggregates enforce grants and scope while counting true account creation dates', async () => {
 const db = new PGlite()
 const one='00000000-0000-4000-8000-000000000001'
 const two='00000000-0000-4000-8000-000000000002'
 try {
  for(const path of ['tests/fixtures/account-schema.sql','tests/fixtures/account-finalize.sql','molip-profiles-upgrade.sql','molip-profiles-finalize-prepare.sql','molip-profiles-finalize.sql','sql/admin/overview-upgrade.sql']) await db.exec(await readFile(path,'utf8'))
  await db.exec(`update auth.users set created_at=now()-interval '10 days' where id='${one}'; select set_config('request.jwt.claim.sub','${two}',false); set role authenticated`)
  const read=async()=> (await db.query('select molip_script.admin_member_overview() as result')).rows[0].result
  await assert.rejects(read(), /Administrator access required/)
  await db.exec(`reset role; insert into molip_profiles.admin_grants(user_id,scope) values('${two}','molip-script'); set role authenticated`)
  assert.deepEqual(await read(),{total_members:2,new_members_7d:1,new_members_24h:1})
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','${one}',false); set role authenticated`)
  assert.deepEqual(await read(),{total_members:3,new_members_7d:2,new_members_24h:2})
 } finally { await db.close() }
})
