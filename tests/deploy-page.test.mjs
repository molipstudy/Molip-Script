import assert from 'node:assert/strict'
import test from 'node:test'
import { verifyPage } from '../scripts/deploy/check-page.mjs'

const built = '<script type="module" crossorigin src="/assets/index-current.js"></script><div id="root"></div>'
test('deployment checks accept only the built entry asset and reject stale pages or protection screens', () => {
  assert.doesNotThrow(() => verifyPage(built, built))
  assert.throws(() => verifyPage(built, built.replace('index-current', 'index-previous')), /일치하지/)
  assert.throws(() => verifyPage(built, '<h1>Log in to Vercel</h1>'), /일치하지/)
  assert.throws(() => verifyPage('<html>Build missing</html>', built), /시작 파일/)
})
