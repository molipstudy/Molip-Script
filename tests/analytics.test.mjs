import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/app/lib/analytics.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText
const { sanitizeAnalyticsEvent } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('analytics removes auth query, hash and credentials while preserving the page path', () => {
  const event = { type: 'pageview', url: 'https://user:secret@script.molip.kro.kr/auth?code=private&next=%2Flibrary#access_token=private' }
  assert.deepEqual(sanitizeAnalyticsEvent(event), { type: 'pageview', url: 'https://script.molip.kro.kr/auth' })
  assert.ok(event.url.includes('private'))
  assert.deepEqual(sanitizeAnalyticsEvent({ type: 'pageview', url: 'https://script.molip.kro.kr/script-id/masking' }), {
    type: 'pageview', url: 'https://script.molip.kro.kr/script-id/masking',
  })
})

test('analytics drops malformed URLs rather than sending unfiltered values', () => {
  assert.equal(sanitizeAnalyticsEvent({ type: 'pageview', url: 'invalid?code=private' }), null)
})
