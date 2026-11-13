import assert from 'node:assert/strict'
import test from 'node:test'
import { notificationFor, sendDiscord } from '../scripts/notifications/discord.mjs'

const repository = { full_name: 'molipstudy/Molip-Script' }
const webhook = 'https://discord.com/api/webhooks/123456/secret_token'
test('commit payload treats shell-like text as data and disables mentions', () => {
  const payload = notificationFor('push', { repository, ref: 'refs/heads/main', commits: [{ id: 'abcdef123', message: '$(env) @everyone <@123>\nsecond line' }] })
  assert.deepEqual(payload.allowed_mentions, { parse: [] })
  assert.match(payload.embeds[0].description, /\$\(env\)/)
  assert.ok(!payload.embeds[0].description.includes('second line'))
})
test('only main pushes with new commits produce commit notifications', () => {
  for (const event of [{ ref: 'refs/heads/feature', commits: [{}] }, { ref: 'refs/heads/main', deleted: true, commits: [{}] }, { ref: 'refs/heads/main', commits: [] }]) {
    assert.equal(notificationFor('push', { repository, ...event }), null)
  }
})
test('only completed production workflow results produce deployment alerts', () => {
  const event = { repository, action: 'completed', workflow_run: { name: 'Deploy production', head_branch: 'main', actor: { login: 'z1hxn' }, head_repository: repository, head_sha: 'abcd1234', html_url: 'https://github.com/molipstudy/Molip-Script/actions/runs/123' } }
  for (const conclusion of ['failure', 'timed_out', 'action_required']) assert.equal(notificationFor('workflow_run', { ...event, workflow_run: { ...event.workflow_run, conclusion } }).embeds[0].title, '배포 작업이 실패했어요')
  assert.equal(notificationFor('workflow_run', { ...event, workflow_run: { ...event.workflow_run, conclusion: 'success' } }).embeds[0].title, '배포에 성공했어요')
  for (const change of [{ conclusion: 'cancelled' }, { conclusion: 'skipped' }, { head_branch: 'feature' }, { name: 'Other job' }, { head_repository: { full_name: 'external/fork' } }, { actor: { login: 'another-user' } }]) {
    assert.equal(notificationFor('workflow_run', { ...event, workflow_run: { ...event.workflow_run, conclusion: 'success', ...change } }), null)
  }
  assert.equal(notificationFor('status', { repository, context: 'Vercel', state: 'failure' }), null)
})
test('unsafe event links and non-Discord webhook targets are rejected', async () => {
  const payload = notificationFor('workflow_run', { repository, action: 'completed', workflow_run: { name: 'Deploy production', head_branch: 'main', actor: { login: 'z1hxn' }, head_repository: repository, conclusion: 'failure', html_url: 'https://example.com', head_sha: 'abcd1234' } })
  assert.match(payload.embeds[0].url, /^https:\/\/github.com\//)
  let called = false
  await assert.rejects(sendDiscord('https://example.com/secret', payload, { fetcher: async () => { called = true } }))
  assert.equal(called, false)
})
test('rate limit is retried with bounded delays; credentials never appear in errors', async () => {
  let calls = 0
  const delays = []
  await sendDiscord(webhook, {}, { fetcher: async () => ++calls === 1 ? { ok: false, status: 429, json: async () => ({ retry_after: 2 }) } : { ok: true }, sleep: async ms => delays.push(ms) })
  assert.equal(calls, 2)
  assert.deepEqual(delays, [2000])
  await assert.rejects(sendDiscord(webhook, {}, { fetcher: async () => { throw new Error(webhook) } }), error => !error.message.includes('secret_token'))
  await assert.rejects(sendDiscord(webhook, {}, { fetcher: async () => ({ ok: false, status: 401 }) }), /HTTP 401/)
})
