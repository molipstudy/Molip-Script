import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const model = await readFile(new URL('../src/features/landing-story/model/story.ts', import.meta.url), 'utf8')
const url = `data:text/javascript;base64,${Buffer.from(ts.transpileModule(model, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`
const { nextRevealProgress, frameStyle, retainProgress, dictationPhase, maskingTokens, storyContent } = await import(url)

test('only the first problem sentence appears at entry, then each sentence is added', () => {
  assert.deepEqual([0, 1, 2].map(index => frameStyle(0, index, 3).opacity), [1, 0, 0])
  assert.equal(frameStyle(0.4, 1, 3).opacity > 0, true)
  assert.equal(frameStyle(0.4, 2, 3).opacity, 0)
  assert.deepEqual([0, 1, 2].map(index => frameStyle(0.8, index, 3).opacity), [1, 1, 1])
})
test('backscroll never hides revealed content or restarts its entrance', () => {
  let progress = 0
  for (const current of [0, 0.35, 0.85, 0.1, 0.6, 0]) progress = retainProgress(progress, current)
  assert.equal(progress, 0.85)
  assert.deepEqual([0, 1, 2].map(index => frameStyle(progress, index, 3)), [{ opacity: 1, y: 0 }, { opacity: 1, y: 0 }, { opacity: 1, y: 0 }])
})
test('rapid scroll jumps and out-of-bounds progress produce bounded styles', () => {
  for (const position of [-5, 0, 0.01, 0.25, 0.6, 1, 3]) {
    for (const index of [0, 1, 2]) {
      const { opacity, y } = frameStyle(position, index, 3)
      assert.ok(opacity >= 0 && opacity <= 1)
      assert.ok(y >= 0 && y <= 18)
    }
  }
})
test('dictation types actual characters, presses grade after input, then holds the graded result', () => {
  assert.equal(dictationPhase(0).answer, '')
  assert.equal(dictationPhase(900).answer, 'p')
  assert.equal(dictationPhase(2000).answer, 'painti')
  assert.equal(dictationPhase(3400).answer, 'painting')
  assert.equal(dictationPhase(3400).secondAnswer, 'VR')
  assert.equal(dictationPhase(3500).pressed, true)
  assert.equal(dictationPhase(3800).graded, true)
  assert.equal(dictationPhase(8500).graded, true)
  assert.equal(dictationPhase(20000).graded, true)
})
test('masking reveals one token at a time and holds the finished state instead of looping', () => {
  assert.equal(maskingTokens(0, 6), 0)
  assert.equal(maskingTokens(1500, 6), 1)
  assert.equal(maskingTokens(2000, 6), 2)
  assert.equal(maskingTokens(6500, 6), 6)
  assert.equal(maskingTokens(15000, 6), 6)
})
test('story begins with the supplied student problem and covers all three learning modes', () => {
  assert.equal(storyContent.problem[0], '영어 본문, 외우기 막막하셨죠?')
  assert.equal(storyContent.problem.length, 3)
  assert.equal(storyContent.flashcard[1], '플래시카드로 확인해 보세요.')
  assert.equal(storyContent.dictation[1], '직접 입력해 보세요.')
  assert.equal(storyContent.masking[1], '단어를 하나씩 가려 보세요.')
})

test('each cue click reveals one further sentence before advancing chapters', () => {
 const second = nextRevealProgress(0,3)
 assert.equal(second,0.45)
 assert.equal(frameStyle(second,2,3).opacity,0)
 const third = nextRevealProgress(second,3)
 assert.equal(third,0.7)
 assert.ok(frameStyle(third,2,3).opacity > 0.999)
 assert.equal(nextRevealProgress(third,3),null)
 assert.equal(nextRevealProgress(0,1),null)
})
