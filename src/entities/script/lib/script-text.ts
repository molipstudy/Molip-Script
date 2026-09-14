import type { QuizItem } from '../model/types'

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'but', 'by', 'for', 'from',
  'had', 'has', 'have', 'he', 'her', 'him', 'his', 'i', 'in', 'is', 'it', 'its', 'my',
  'of', 'on', 'or', 'our', 'she', 'that', 'the', 'their', 'them', 'they', 'this', 'to',
  'was', 'we', 'were', 'with', 'you', 'your', 'will', 'every', 'day',
])

export const normalizeWord = (value: string) =>
  value.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '').trim()

export const normalizeAnswer = (value: string) =>
  value.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, '').trim()

export const parseTokenParts = (token: string) => {
  const match = token.match(/^([^A-Za-z0-9']*)([A-Za-z0-9']+)([^A-Za-z0-9']*)$/)
  if (!match) return { prefix: '', core: '', suffix: '' }
  const [, prefix, core, suffix] = match
  return { prefix, core, suffix }
}

export const extractWords = (english: string) =>
  Array.from(
    new Set(
      english
        .split(/\s+/)
        .map(normalizeWord)
        .filter((word) => word.length > 1 && !STOP_WORDS.has(word)),
    ),
  )

export const parseItems = (rawText: string): QuizItem[] => {
  const lines = rawText
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^\[[^\]]*]$/.test(line))

  const items: QuizItem[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const numberMatch = lines[index].match(/^(\d+)\.\s*(.+)$/)
    if (!numberMatch) continue
    const nextLine = lines[index + 1] ?? ''
    if (!nextLine || /^\d+\.\s+/.test(nextLine)) continue
    items.push({ number: numberMatch[1], meaning: numberMatch[2].trim(), english: nextLine.trim() })
    index += 1
  }
  return items
}

export const sentenceKeyOf = (item: QuizItem, index: number) =>
  `${index}:${item.number}:${item.english.toLowerCase().replace(/\s+/g, ' ').trim()}`

// Section headings between numbered sentence pairs are not study content.
// Incomplete numbered entries still fail validation instead of disappearing.
export const parseEditorItems = (rawText: string): QuizItem[] | null => {
  const lines = rawText.replace(/\r/g, '').split('\n').map((line) => line.trim()).filter(Boolean)
  const items: QuizItem[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!/^\d+\./.test(line)) continue
    const match = line.match(/^(\d+)\.\s*(.+)$/)
    const english = lines[index + 1]
    if (!match || !english || /^\d+\./.test(english) || /^\[[^\]]*]$/.test(english)) return null
    items.push({ number: match[1], meaning: match[2], english })
    index += 1
  }
  return items
}

export const serializeItems = (items: QuizItem[]) =>
  items.map((item) => `${item.number}. ${item.meaning}\n${item.english}`).join('\n\n')

// Stored in excluded_words as versioned occurrence keys, never as global words.
// The sentence text guard prevents old positions from excluding newly edited text.
export const exclusionKeyOf = (item: QuizItem, sentenceIndex: number, tokenIndex: number) =>
  `@token/v1/${JSON.stringify([sentenceIndex, item.english.trim().replace(/\s+/g, ' '), tokenIndex])}`

export const validExclusionKeys = (items: QuizItem[], keys: string[]) => {
  const selected = new Set(keys)
  return items.flatMap((item, sentenceIndex) => item.english.split(/\s+/).filter(Boolean)
    .flatMap((token, tokenIndex) => {
      const key = exclusionKeyOf(item, sentenceIndex, tokenIndex)
      return parseTokenParts(token).core && selected.has(key) ? [key] : []
    }))
}

// Direct input is a batch selection of exact tokens in the current draft.
// In particular, "Tim:" does not match "Tim" in dialogue.
export const exclusionKeysForTokens = (items: QuizItem[], input: string) => {
  const tokens = new Set(input.split(/[\s,;]+/).filter(Boolean).map((token) => token.toLowerCase()))
  return items.flatMap((item, sentenceIndex) => item.english.split(/\s+/).filter(Boolean)
    .flatMap((token, tokenIndex) => tokens.has(token.toLowerCase()) && parseTokenParts(token).core
      ? [exclusionKeyOf(item, sentenceIndex, tokenIndex)] : []))
}

export const remapExclusionKeys = (before: (QuizItem & { id?: string })[], after: (QuizItem & { id?: string })[], keys: string[]) => {
  const selected = new Set(keys)
  const textOf = (item: QuizItem) => item.english.trim().replace(/\s+/g, ' ')
  return after.flatMap((item, nextIndex) => {
    const text = textOf(item)
    // Card IDs survive insertion/reordering. Raw edits can only match unique sentences safely.
    const previousIndex = item.id
      ? before.findIndex((previous) => previous.id === item.id && textOf(previous) === text)
      : before.filter((previous) => textOf(previous) === text).length === 1 && after.filter((next) => textOf(next) === text).length === 1
        ? before.findIndex((previous) => textOf(previous) === text) : -1
    if (previousIndex < 0) return []
    return item.english.split(/\s+/).filter(Boolean).flatMap((_, tokenIndex) =>
      selected.has(exclusionKeyOf(before[previousIndex], previousIndex, tokenIndex))
        ? [exclusionKeyOf(item, nextIndex, tokenIndex)] : [])
  })
}
