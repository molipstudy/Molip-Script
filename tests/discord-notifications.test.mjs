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
test('Vercel failures including integration rejection and later success are distinct alerts', () => {
  const base = { repository, context: 'Vercel', sha: 'abcd1234', target_url: 'https://vercel.com/project/deployment' }
  for (const state of ['failure', 'error']) assert.equal(notificationFor('status', { ...base, state }).embeds[0].title, '배포에 실패했어요')
  assert.equal(notificationFor('status', { ...base, state: 'success' }).embeds[0].title, '배포에 성공했어요')
  assert.equal(notificationFor('status', { ...base, state: 'pending' }), null)
  assert.equal(notificationFor('status', { ...base, context: 'Other check', state: 'failure' }), null)
})
test('unsafe event links and non-Discord webhook targets are rejected', async () => {
  const payload = notificationFor('status', { repository, context: 'Vercel', state: 'failure', target_url: 'https://example.com', sha: 'abcd1234' })
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
