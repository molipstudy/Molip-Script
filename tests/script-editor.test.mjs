import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const moduleUrl = async (path, replacements = []) => {
  let source = await readFile(new URL(path, import.meta.url), 'utf8')
  for (const [from, to] of replacements) source = source.replace(from, to)
  return `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText).toString('base64')}`
}
const textUrl = await moduleUrl('../src/entities/script/lib/script-text.ts')
const { parseItems, parseEditorItems, serializeItems, normalizeWord } = await import(textUrl)
const { makeDictationQuestion, collectBlanks } = await import(await moduleUrl(
  '../src/features/dictation/lib/dictation.ts', [["'../../../entities/script'", JSON.stringify(textUrl)]],
))

test('raw → cards → raw preserves numbering, Korean, English and punctuation', () => {
  const raw = "7. 서울에 가요.\nI'm going to Seoul!\n\n9. 좋아요.\nGreat."
  assert.equal(serializeItems(parseEditorItems(raw)), raw)
  assert.deepEqual(parseEditorItems(''), [])
  assert.equal(parseEditorItems(raw.replaceAll('\n', '\r\n')).length, 2)
})

test('conversion still rejects incomplete numbered entries', () => {
  for (const raw of ['1. 뜻', '1. 뜻\n2. 다음 뜻', '1. 뜻\n[제목]', '1.\nEnglish.', '본문\n1. 뜻\nEnglish.\nWrap Up\n2. 다음 뜻']) {
    assert.equal(parseEditorItems(raw), null, raw)
  }
})

test('excluded words never become blanks even when marked weak or blank ratio is 100%', () => {
  const item = { number: '1', meaning: '서울', english: 'Seoul, SEOUL! lovely Seoul.' }
  const excluded = new Set([normalizeWord('Seoul!')])
  for (let i = 0; i < 50; i += 1) {
    const question = makeDictationQuestion(item, 0, new Set(['seoul']), 100, excluded)
    assert.deepEqual(collectBlanks(question).map((blank) => blank.answer), ['lovely'])
    assert.equal(question.units.filter((unit) => unit.kind === 'text').length, 3)
  }
})

test('fully excluded and punctuation-only sentences contain no blanks', () => {
  for (const english of ['Seoul, SEOUL!', '... —']) {
    assert.equal(collectBlanks(makeDictationQuestion({ number: '1', meaning: '뜻', english }, 0, new Set(['seoul']), 100, new Set(['seoul']))).length, 0)
  }
})

test('existing scripts without exclusions retain normal quiz generation', () => {
  const question = makeDictationQuestion({ number: '1', meaning: '좋아요', english: 'It is great.' }, 0, new Set(), 100)
  assert.deepEqual(collectBlanks(question).map((blank) => blank.answer), ['It', 'is', 'great'])
})


test('section headings before, between and after sentence pairs are ignored', () => {
  const raw = `본문

1. Schofield 박사, 한국을 사랑한 외국인
   He wrote an article about the March 1st Movement and sent it to foreign newspapers.
2. 1958년에 그는 한국 정부의 초청으로 한국으로 돌아왔다.
   In 1958, he returned to Korea at the invitation of the Korean government.

Wrap Up – Grammar and Writing

3. Anna는 Tom이 이 책을 읽고 있는 것을 보았다.
   Anna saw Tom reading a book.
4. Anna는 Lisa가 노래 부르고 있는 것을 들었다.
   Anna heard Lisa singing.

[마무리]
추가 학습`
  const items = parseEditorItems(raw)
  assert.equal(items.length, 4)
  assert.deepEqual(items.map((item) => item.number), ['1', '2', '3', '4'])
  assert.equal(items[2].english, 'Anna saw Tom reading a book.')
  assert.deepEqual(items, parseItems(raw))
  assert.deepEqual(parseEditorItems(serializeItems(items)), items)
  assert.deepEqual(parseEditorItems('[제목]\n1. 뜻\nEnglish.'), [{ number: '1', meaning: '뜻', english: 'English.' }])
  assert.deepEqual(parseEditorItems('본문\nWrap Up – Grammar and Writing'), [])
})


const { moveCardToGap } = await import(await moduleUrl('../src/pages/editor/lib/reorder-cards.ts'))
test('moving cards to the start, middle and end preserves sentence pairs and updates raw numbering', () => {
  const cards = ['a', 'b', 'c', 'd'].map((id, index) => ({ id, number: String(index + 7), meaning: `뜻 ${id}`, english: `Sentence ${id}.` }))
  for (const [id, gap, expected] of [['a', 4, 'bcda'], ['d', 0, 'dabc'], ['a', 2, 'bacd'], ['d', 2, 'abdc']]) {
    const moved = moveCardToGap(cards, id, gap)
    assert.equal(moved.map((card) => card.id).join(''), expected)
    assert.deepEqual(moved.map((card) => card.number), ['1', '2', '3', '4'])
    assert.deepEqual(parseEditorItems(serializeItems(moved)), moved.map(({ number, meaning, english }) => ({ number, meaning, english })))
    for (const card of moved) assert.equal(card.meaning, `뜻 ${card.id}`)
  }
  assert.deepEqual(cards.map((card) => card.number), ['7', '8', '9', '10'])
  for (const [id, gap] of [['a', 0], ['a', 1], ['d', 4], ['missing', 0], ['a', -1], ['a', 5]]) {
    assert.equal(moveCardToGap(cards, id, gap), cards)
  }
})
