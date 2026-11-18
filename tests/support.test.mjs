import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const read=path=>readFile(new URL(path,import.meta.url),'utf8')
const one='00000000-0000-4000-8000-000000000001',two='00000000-0000-4000-8000-000000000002',three='00000000-0000-4000-8000-000000000003'
test('support conversations remain private and only service admins can answer as staff',async()=>{
 const db=new PGlite()
 try{
  for(const path of ['./fixtures/account-schema.sql','./fixtures/account-finalize.sql','../molip-profiles-upgrade.sql','../molip-profiles-finalize-prepare.sql','../molip-profiles-finalize.sql','../sql/support-upgrade.sql'])await db.exec(await read(path))
  const as=async id=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${id}',false);set role authenticated`)
  const query=async(sql,args)=>(await db.query(sql,args)).rows[0]?.result
  await db.exec('set role anon')
  await assert.rejects(db.query("select molip_script.support_create('test','body')"),/permission denied/)
  await as(two)
  await assert.rejects(db.query("select molip_script.support_create(' ','body')"),/Invalid inquiry/)
  const id=await query("select molip_script.support_create('학습 문의','문장을 추가하고 싶어요') result")
  const list=await query('select molip_script.support_list(false,0) result')
  assert.equal(list.total,1);assert.equal(list.items[0].id,id)
  await assert.rejects(db.query('select * from molip_support.messages'),/permission denied/)
  await assert.rejects(db.query('select molip_script.support_list(true,0)'),/Administrator access required/)
  await as(three)
  assert.equal((await query('select molip_script.support_list(false,0) result')).total,0)
  await assert.rejects(db.query('select molip_script.support_detail($1,false,0)',[id]),/Inquiry unavailable/)
  await assert.rejects(db.query("select molip_script.support_reply($1,'attack',false)",[id]),/Inquiry unavailable/)
  await assert.rejects(db.query("select molip_script.support_reply($1,'spoof',true)",[id]),/Administrator access required/)
  await as(one)
  assert.equal((await query('select molip_script.support_list(true,0) result')).total,1)
  await db.query("select molip_script.support_reply($1,'스크립트 편집에서 문장을 추가해 주세요',true)",[id])
  await as(two)
  let detail=await query('select molip_script.support_detail($1,false,0) result',[id])
  assert.equal(detail.thread.status,'answered');assert.equal(detail.messages.length,2)
  assert.equal(detail.messages[1].sender_kind,'admin')
  await db.query("select molip_script.support_reply($1,'감사합니다',false)",[id])
  detail=await query('select molip_script.support_detail($1,false,0) result',[id])
  assert.equal(detail.thread.status,'waiting');assert.equal(detail.messages.length,3)
  assert.equal(detail.messages[2].sender_kind,'member')
  await assert.rejects(db.query('select molip_script.support_detail($1,false,-1)',[id]),/Invalid page/)
  await assert.rejects(db.query('select molip_script.support_reply($1,$2,false)',[id,'x'.repeat(4001)]),/Invalid message/)
  // More than one page remains readable, newest page first and chronological within it.
  for(let i=0;i<25;i++)await db.query('select molip_script.support_reply($1,$2,false)',[id,`추가 ${i}`])
  const latest=await query('select molip_script.support_detail($1,false,0) result',[id])
  const older=await query('select molip_script.support_detail($1,false,1) result',[id])
  assert.equal(latest.messages.length,25);assert.equal(older.messages.length,3);assert.equal(latest.total_messages,28)
 }finally{await db.close()}
})
