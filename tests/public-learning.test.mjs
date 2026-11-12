import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const load = async (path) => {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  return import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText).toString('base64')}`)
}
const { sentenceTokens, parseItems } = await load('../src/entities/script/lib/script-text.ts')
const { parseAppPath, pathForScreen } = await load('../src/app/lib/routing.ts')
const { normalizeStore } = await load('../src/entities/learning/lib/store.ts')
const { queueUnknown } = await load('../src/entities/learning/lib/masking.ts')
const { trialScript } = await load('../src/entities/script/model/trial.ts')

test('word selection includes stop words, single letters, case, punctuation and separate duplicates', () => {
  assert.deepEqual(sentenceTokens("I see Seoul, and I see SEOUL!"), ['I', 'see', 'Seoul,', 'and', 'I', 'see', 'SEOUL!'])
  assert.deepEqual(sentenceTokens(' A\tA  a\nB '), ['A', 'A', 'a', 'B'])
})

test('masking route and private library round trip without changing existing study routes', () => {
  for (const screen of ['script', 'flashcard', 'dictation', 'masking', 'history']) {
    const path = pathForScreen(screen, 'a b')
    assert.deepEqual(parseAppPath(path), { scriptId: 'a b', screen })
  }
  assert.equal(parseAppPath('/library').screen, 'library')
  assert.equal(parseAppPath('/community/shared').communityId, 'shared')
})

test('old user data, stars and active flashcards survive normalization with no masking fields', () => {
  const script = { id: 'existing', title: 'My script', raw_text: '1. 뜻\nEnglish.', created_at: 'old', updated_at: 'old', last_opened_at: 'old' }
  const stat = { script_id: 'existing', sentence_key: 'key', number: '1', meaning: '뜻', english: 'English.', starred: true, flashcard_unknown_count: 3, dictation_attempts: 4, dictation_wrong_count: 2 }
  const active = { id: 'active', script_id: 'existing', quiz_type: 'flashcard', mode: 'standard', state: { queue: [0], currentIndex: 0 }, progress: 1, updated_at: 'old' }
  const store = normalizeStore([script], [stat], [{ script_id: 'existing', word: 'english', source: 'flashcard', wrong_count: 7 }], [], [{ id: 'session', script_id: 'existing', total_cards: 2, unknown_cards: 1, tracked_words: ['english'] }], [active])
  assert.equal(store.sentenceStatsByScript.existing.key.starred, true)
  assert.equal(store.sentenceStatsByScript.existing.key.flashcardUnknownCount, 3)
  assert.equal(store.wordStatsByScript.existing[0].wrongCount, 7)
  assert.equal(store.flashcardSessions[0].quizType, 'flashcard')
  assert.deepEqual(store.activeQuizzes[0].state, active.state)
  assert.equal(store.scripts[0].rawText, script.raw_text)
})

test('masking evaluations keep only wrong source sentences and can be corrected independently', () => {
  const grades = { 0: false, 2: true, 5: false }
  assert.deepEqual(queueUnknown(grades), [0, 5])
  assert.deepEqual(queueUnknown({ ...grades, 0: true }), [5])
  assert.deepEqual(queueUnknown({}), [])
})

test('dedicated trial contains valid sentence pairs for all study types', () => {
  assert.equal(trialScript.id, 'molip-trial')
  assert.equal(parseItems(trialScript.rawText).length, 5)
})
