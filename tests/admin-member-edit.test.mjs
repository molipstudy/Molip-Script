import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const read = path => readFile(new URL(path, import.meta.url), 'utf8')
test('only global admins edit shared display fields, preserving auth and service identity', async () => {
 const db = new PGlite()
 const one = '00000000-0000-4000-8000-000000000001'
 const two = '00000000-0000-4000-8000-000000000002'
 try {
  for (const path of ['./fixtures/account-schema.sql', './fixtures/account-finalize.sql', '../molip-profiles-upgrade.sql', '../molip-profiles-finalize-prepare.sql', '../molip-profiles-finalize.sql', '../sql/admin/member-edit-upgrade.sql']) await db.exec(await read(path))
  const rows = async sql => (await db.query(sql)).rows
  const call = (name, source) => `select molip_script.admin_update_member('${two}', '${name}', ${source}) as detail`
  await db.exec(`select set_config('request.jwt.claim.sub','${two}',false); set role authenticated`)
  await assert.rejects(db.query(call('Not allowed', "'Instagram'")), /Administrator access required/)
  await db.exec(`reset role; insert into molip_profiles.admin_grants(user_id,scope) values('${two}','molip-script'); set role authenticated`)
  await assert.rejects(db.query(call('Still denied', "'Instagram'")), /Administrator access required/)
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','${one}',false); set role authenticated`)
  const result = (await rows(call('Edited display', "'Instagram'")))[0].detail
  assert.equal(result.username, 'Edited display')
  assert.equal(result.signup_source, 'Instagram')
  assert.equal(result.login_id, 'login_two')
  assert.equal(result.email, 'two@example.test')
  assert.equal((await rows(call('Edited display', 'null')))[0].detail.signup_source, '미선택')
  await assert.rejects(db.query(call('', 'null')), /Invalid member fields/)
  await assert.rejects(db.query(call('Name', "'unknown'")), /Invalid member fields/)
  await db.exec('reset role')
  assert.equal((await rows(`select email from auth.users where id='${two}'`))[0].email, 'two@example.test')
  assert.equal((await rows(`select username from molip_profiles.profiles where id='${two}'`))[0].username, 'Edited display')
 } finally { await db.close() }
})
