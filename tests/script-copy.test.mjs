import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const read=path=>readFile(new URL(path,import.meta.url),'utf8')
const one='00000000-0000-4000-8000-000000000001',two='00000000-0000-4000-8000-000000000002'
test('copy and administrator preview enforce ownership without changing original content or learning',async()=>{
 const db=new PGlite()
 try {
  for(const path of ['./fixtures/account-schema.sql','./fixtures/account-finalize.sql','../molip-profiles-upgrade.sql','../molip-profiles-finalize-prepare.sql','../molip-profiles-finalize.sql'])await db.exec(await read(path))
  await db.exec(`alter table molip_script.scripts add column title text default 'Original';alter table molip_script.scripts add column raw_text text default '1. 뜻\nEnglish.';alter table molip_script.scripts add column excluded_words text[] default array['0:1'];alter table molip_script.scripts add column created_at timestamptz default now();alter table molip_script.scripts add column updated_at timestamptz default now();alter table molip_script.scripts add column last_opened_at timestamptz default now();
  insert into molip_script.scripts(id,owner_id,title) values('admin-private','${one}','Admin original');`)
  await db.exec(await read('../sql/admin/script-preview-upgrade.sql'))
  const initial=(await db.query("select to_jsonb(s) as row from molip_script.scripts s where id='script-preserved'")).rows[0].row
  await db.exec('set role anon')
  await assert.rejects(db.query("select molip_script.copy_script('script-preserved')"),/permission denied/)
  await db.exec(`reset role;select set_config('request.jwt.claim.sub','${two}',false);set role authenticated`)
  await assert.rejects(db.query("select molip_script.admin_script_preview('script-preserved')"),/Administrator access required/)
  await assert.rejects(db.query("select molip_script.copy_script('admin-private')"),/Script unavailable/)
  const copy=(await db.query("select molip_script.copy_script('script-preserved') result")).rows[0].result
  assert.notEqual(copy.id,'script-preserved');assert.equal(copy.raw_text,initial.raw_text);assert.deepEqual(copy.excluded_words,initial.excluded_words)
  await db.exec(`reset role;select set_config('request.jwt.claim.sub','${one}',false);set role authenticated`)
  const preview=(await db.query("select molip_script.admin_script_preview('script-preserved') result")).rows[0].result
  assert.equal(preview.owner_id,two);assert.equal(preview.raw_text,initial.raw_text)
  const adminCopy=(await db.query("select molip_script.copy_script('script-preserved') result")).rows[0].result
  assert.notEqual(adminCopy.id,copy.id)
  assert.equal((await db.query("select molip_script.admin_script_preview('missing') result")).rows[0].result,null)
  await db.exec('reset role')
  assert.equal((await db.query('select owner_id from molip_script.scripts where id=$1',[copy.id])).rows[0].owner_id,two)
  assert.equal((await db.query('select owner_id from molip_script.scripts where id=$1',[adminCopy.id])).rows[0].owner_id,one)
  assert.deepEqual((await db.query("select to_jsonb(s) as row from molip_script.scripts s where id='script-preserved'")).rows[0].row,initial)
  for(const table of ['active_quizzes','dictation_sessions','flashcard_sessions'])assert.equal((await db.query(`select count(*)::int n from molip_script.${table}`)).rows[0].n,0)
 }finally{await db.close()}
})
