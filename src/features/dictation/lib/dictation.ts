import { normalizeAnswer, normalizeWord, parseTokenParts, sentenceKeyOf } from '../../../entities/script'
import type { QuizItem } from '../../../entities/script'
import type { BlankUnit, DictationGrade, DictationQuestion, SentenceUnit } from '../../../entities/learning'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const pickRandom = (pool: number[], count: number) => {
  const next = [...pool]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[target]] = [next[target], next[index]]
  }
  return next.slice(0, count)
}

export const makeDictationQuestion = (
  item: QuizItem,
  sourceIndex: number,
  weakWords: Set<string>,
  blankPercent: number,
): DictationQuestion => {
  const tokens = item.english.split(/\s+/).filter(Boolean)
  const candidateIndexes = tokens
    .map((token, index) => ({ index, core: parseTokenParts(token).core }))
    .filter(({ core }) => core.length > 0)
  const weakIndexes = candidateIndexes
    .filter(({ core }) => weakWords.has(normalizeWord(core)))
    .map(({ index }) => index)
  const randomIndexes = candidateIndexes.map(({ index }) => index)
  const targetCount = clamp(
    Math.ceil(candidateIndexes.length * (blankPercent / 100)),
    1,
    Math.max(1, candidateIndexes.length),
  )
  const selected = new Set<number>(weakIndexes)

  if (selected.size < targetCount) {
    pickRandom(
      randomIndexes.filter((index) => !selected.has(index)),
      targetCount - selected.size,
    ).forEach((index) => selected.add(index))
  }

  const units: SentenceUnit[] = tokens.map((token, index) => {
    if (!selected.has(index)) return { kind: 'text', token }
    const { prefix, core, suffix } = parseTokenParts(token)
    if (!core) return { kind: 'text', token }
    return {
      kind: 'blank',
      blankId: `${item.number}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      prefix,
      suffix,
      answer: core,
      width: Math.max(72, Math.min(240, core.length * 13 + 24)),
    }
  })

  return { item, sourceIndex, sentenceKey: sentenceKeyOf(item, sourceIndex), units }
}

export const collectBlanks = (question: DictationQuestion) =>
  question.units.filter((unit): unit is BlankUnit => unit.kind === 'blank')

export const questionSentence = (question: DictationQuestion) =>
  question.units
    .map((unit) => (unit.kind === 'text' ? unit.token : `${unit.prefix}${unit.answer}${unit.suffix}`))
    .join(' ')

export const createAnswers = (questions: DictationQuestion[]) => {
  const answers: Record<string, string> = {}
  questions.forEach((question) => {
    collectBlanks(question).forEach((blank) => {
      answers[blank.blankId] = ''
    })
  })
  return answers
}

export const gradeQuestion = (
  question: DictationQuestion,
  answersById: Record<string, string>,
): DictationGrade => {
  const checkedById: Record<string, boolean> = {}
  const wrongWords: string[] = []
  let correct = 0
  const blanks = collectBlanks(question)

  blanks.forEach((blank) => {
    const expected = normalizeAnswer(blank.answer)
    const typed = normalizeAnswer(answersById[blank.blankId] ?? '')
    const isCorrect = typed !== '' && typed === expected
    checkedById[blank.blankId] = isCorrect
    if (isCorrect) correct += 1
    else wrongWords.push(normalizeWord(blank.answer))
  })

  return { total: blanks.length, correct, checkedById, wrongWords }
}

export const gradeFromCheckedBlanks = (
  question: DictationQuestion,
  checkedById: Record<string, boolean>,
): DictationGrade => {
  const blanks = collectBlanks(question)
  const wrongWords: string[] = []
  let correct = 0

  blanks.forEach((blank) => {
    if (checkedById[blank.blankId]) correct += 1
    else wrongWords.push(normalizeWord(blank.answer))
  })

  return { total: blanks.length, correct, checkedById, wrongWords }
}
