import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const url = async (path, replacements = []) => {
  let source = await readFile(new URL(path, import.meta.url), 'utf8')
  for (const [from, to] of replacements) source = source.replace(from, to)
  return `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText).toString('base64')}`
}
const scriptUrl = await url('../src/entities/script/lib/script-text.ts')
const { sentenceKeyOf, parseItems } = await import(scriptUrl)
const { dashboardData, savedPosition } = await import(await url('../src/pages/home/lib/dashboard.ts', [["'../../../entities/script'", JSON.stringify(scriptUrl)]]))
const { parseAppPath, pathForScreen } = await import(await url('../src/app/lib/routing.ts'))
const script = id => ({ id, title: id, rawText: '1. 뜻\nEnglish sentence.', updatedAt: '2026-01-01', lastOpenedAt: '2026-12-01' })
const empty = () => ({ scripts: [], activeQuizzes: [], sentenceStatsByScript: {}, wordStatsByScript: {}, dictationSessions: [], flashcardSessions: [] })
const quiz = (kind, index, date = '2026-02-01') => ({ id: kind, scriptId: 'a', quizType: kind, mode: 'standard', state: kind === 'dictation' ? { questions: [1, 2, 3, 4], currentIndex: index, gradesByIndex: {} } : { queue: [0, 1, 2, 3, 4, 5], currentIndex: index }, progress: 99, updatedAt: date })

test('new users and scripts without learning records do not get fabricated recent activity', () => {
  assert.deepEqual(dashboardData(empty()), { recent: [], suggested: [], review: [] })
  const data = dashboardData({ ...empty(), scripts: [script('a')] })
  assert.equal(data.recent.length, 0)
  assert.equal(data.suggested[0].lastStudiedAt, undefined)
  assert.equal(data.suggested[0].active.length, 0)
})
test('only active scripts appear, sorted by saved learning without a fixed limit', () => {
  const store = { ...empty(), scripts: ['a', 'b', 'c', 'd', 'completed'].map(script), activeQuizzes: ['a', 'b', 'c', 'd'].map((id, i) => ({ ...quiz('flashcard', 0, `2026-02-0${i + 1}`), scriptId: id, id })), flashcardSessions: [{ scriptId: 'completed', createdAt: '2026-11-01' }] }
  assert.deepEqual(dashboardData(store).recent.map(entry => entry.script.id), ['d', 'c', 'b', 'a'])
})
test('all modes keep their own exact saved cursor and original resume record', () => {
  const activeQuizzes = [quiz('flashcard', 1), quiz('dictation', 2), quiz('masking', 4)]
  const data = dashboardData({ ...empty(), scripts: [script('a')], activeQuizzes })
  assert.equal(data.recent[0].active.length, 3)
  for (const record of data.recent[0].active) assert.equal(record, activeQuizzes.find(quiz => quiz.id === record.id))
  assert.deepEqual(savedPosition(activeQuizzes[0]), { total: 6, position: 2, percent: 33 })
  assert.deepEqual(savedPosition(activeQuizzes[1]), { total: 4, position: 3, percent: 75 })
  assert.deepEqual(savedPosition(activeQuizzes[2]), { total: 6, position: 5, percent: 83 })
})
test('completed sessions without active learning do not appear on the dashboard', () => {
  const data = dashboardData({ ...empty(), scripts: [script('a')], flashcardSessions: [{ scriptId: 'a', quizType: 'masking', createdAt: '2026-02-01' }] })
  assert.deepEqual(data.recent, [])
})
test('review counts only existing sentences and includes masking mistakes once per sentence', () => {
  const current = script('a')
  const key = sentenceKeyOf(parseItems(current.rawText)[0], 0)
  const data = dashboardData({ ...empty(), scripts: [current], sentenceStatsByScript: { a: { [key]: { maskingWrongCount: 1, dictationWrongCount: 2, flashcardUnknownCount: 3 }, stale: { dictationWrongCount: 9 } } } })
  assert.equal(data.review[0].weakCount, 1)
})
test('service introduction has its own route while the home route remains root', () => {
  assert.deepEqual(parseAppPath('/about'), { screen: 'about', scriptId: null })
  assert.equal(pathForScreen('about', 'a'), '/about')
  assert.equal(pathForScreen('home', 'a'), '/')
})
