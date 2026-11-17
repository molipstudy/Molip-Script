import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'
const source = await readFile(new URL('../src/entities/learning/lib/masking.ts', import.meta.url), 'utf8')
const { revealNextToken, createLearningSaveQueue } = await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`)

test('next reveal skips manually opened words and fills the earliest hidden word', () => {
 let visible = [1, 3]
 visible = revealNextToken(visible, 4)
 assert.deepEqual(visible, [1, 3, 0])
 visible = revealNextToken(visible, 4)
 assert.deepEqual(visible, [1, 3, 0, 2])
 assert.equal(revealNextToken(visible, 4), visible)
 assert.deepEqual(revealNextToken([], 0), [])
 assert.deepEqual(revealNextToken([1, 2, 3], 4), [1, 2, 3, 0])
})

test('rapid saves and navigation cannot overtake a delayed save or overwrite the newest snapshot', async () => {
 const enqueue = createLearningSaveQueue()
 const started = []
 const completed = []
 let finishFirst
 const gate = new Promise(resolve => { finishFirst = resolve })
 const first = enqueue(async () => { started.push('first'); await gate; completed.push([0]) })
 const second = enqueue(async () => { started.push('second'); completed.push([0, 1]) })
 const last = enqueue(async () => { started.push('navigation'); completed.push([0, 1, 2]) })
 await Promise.resolve()
 assert.deepEqual(started, ['first'])
 finishFirst()
 await Promise.all([first, second, last])
 assert.deepEqual(started, ['first', 'second', 'navigation'])
 assert.deepEqual(completed, [[0], [0, 1], [0, 1, 2]])
})

test('a failed save does not block subsequent saves', async () => {
 const enqueue = createLearningSaveQueue()
 const failed = enqueue(async () => { throw new Error('Offline') })
 const next = enqueue(async () => 'latest saved')
 await assert.rejects(failed, /Offline/)
 assert.equal(await next, 'latest saved')
})
