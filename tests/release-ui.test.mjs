import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const moduleUrl = async (path, replacements = []) => {
  let source = await readFile(new URL(path, import.meta.url), 'utf8')
  for (const [from, to] of replacements) source = source.replaceAll(from, to)
  let js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  for (const name of ['react', 'react/jsx-runtime']) {
    const target = JSON.stringify(pathToFileURL(require.resolve(name)).href)
    js = js.replaceAll(`'${name}'`, target).replaceAll(`"${name}"`, target)
  }
  return `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
}
const text = await moduleUrl('../src/entities/script/lib/script-text.ts')
const lib = await moduleUrl('../src/shared/lib/app-utils.ts')
const skeleton = await moduleUrl('../src/shared/ui/LoadingSkeleton.tsx')
const ui = await moduleUrl('../src/shared/ui/index.tsx', [["'./LoadingSkeleton'", JSON.stringify(skeleton)]])
const dashboard = await moduleUrl('../src/pages/home/lib/dashboard.ts', [["'../../../entities/script'", JSON.stringify(text)]])
const cards = await moduleUrl('../src/pages/home/ui/LearningCards.tsx', [["'../../../shared/lib'", JSON.stringify(lib)], ["'../../../shared/ui'", JSON.stringify(ui)], ["'../lib/dashboard'", JSON.stringify(dashboard)]])
const replacements = [["'./LearningCards'", JSON.stringify(cards)], ["'../../../shared/ui'", JSON.stringify(ui)], ["'../lib/dashboard'", JSON.stringify(dashboard)]]
const { DashboardPage } = await import(await moduleUrl('../src/pages/home/ui/DashboardPage.tsx', replacements))
const { ContinuePage } = await import(await moduleUrl('../src/pages/home/ui/ContinuePage.tsx', replacements))
const { CommunityCounts } = await import(await moduleUrl('../src/features/community-social/ui/CommunityCounts.tsx'))
const { parseAppPath, pathForScreen } = await import(await moduleUrl('../src/app/lib/routing.ts'))
const noop = () => {}
const store = {
  scripts: ['a', 'b', 'c', 'd'].map(id => ({ id, title: `script-${id}`, rawText: '1. 뜻\nEnglish.', updatedAt: '2026-11-12T00:00:00Z' })),
  activeQuizzes: ['a', 'b', 'c', 'd'].map((id, index) => ({ id, scriptId: id, quizType: 'flashcard', mode: 'standard', updatedAt: `2026-11-12T00:00:0${index}Z`, state: { queue: [0, 1, 2], currentIndex: 0 }, progress: 1 })),
  sentenceStatsByScript: {}, wordStatsByScript: {}, dictationSessions: [], flashcardSessions: [],
}
const callbacks = { onOpen: noop, onResume: noop, onMore: noop, onCreate: noop, onLibrary: noop, onCommunity: noop, onReview: noop, onBack: noop }

test('home renders only three latest active script cards, full continuation page renders all', () => {
  const home = renderToStaticMarkup(createElement(DashboardPage, { store, ...callbacks }))
  const all = renderToStaticMarkup(createElement(ContinuePage, { store, ...callbacks }))
  assert.equal((home.match(/class="dashboard-script"/g) ?? []).length, 3)
  assert.equal((all.match(/class="dashboard-script"/g) ?? []).length, 4)
  assert.ok(!home.includes('script-a'))
  assert.ok(all.includes('script-a'))
  assert.ok(home.includes('더 보기'))
})

test('no active learning means no placeholder cards or continuation heading', () => {
  const home = renderToStaticMarkup(createElement(DashboardPage, { store: { ...store, activeQuizzes: [] }, ...callbacks }))
  assert.ok(!home.includes('class="dashboard-script"'))
  assert.ok(!home.includes('최근 학습'))
})

test('public community counts display real values and do not invent missing statistics', () => {
  assert.equal(renderToStaticMarkup(createElement(CommunityCounts, {})), '')
  const counts = renderToStaticMarkup(createElement(CommunityCounts, { summary: { like_count: 7, collection_count: 2, comment_count: 4, liked: false, script_id: 'post' } }))
  assert.ok(counts.includes('좋아요 7'))
  assert.ok(counts.includes('담은 수 2'))
  assert.ok(counts.includes('댓글 4'))
})

test('publisher profiles and full continuation pages survive direct route navigation', () => {
  const publisherId = 'ce19e19d-7ce2-4dc6-854d-05f51d5c5459'
  assert.deepEqual(parseAppPath(pathForScreen('publisher', null, null, null, publisherId)), { screen: 'publisher', scriptId: null, publisherId })
  assert.deepEqual(parseAppPath('/continue'), { screen: 'continue', scriptId: null })
})

test('page skeletons expose one loading announcement while decorative shapes stay inaccessible', async () => {
  const { LoadingSkeleton } = await import(skeleton)
  for (const view of ['admin', 'admin-member', 'profile-fields', 'masking', 'community', 'auth', 'editor']) {
    const html = renderToStaticMarkup(createElement(LoadingSkeleton, { view }))
    assert.equal((html.match(/role="status"/g) || []).length, 1)
    assert.ok(html.includes('aria-busy="true"'))
    assert.ok(html.includes('aria-hidden="true"'))
    assert.ok(!/<(button|input|select|a)[ >]/.test(html))
  }
})
