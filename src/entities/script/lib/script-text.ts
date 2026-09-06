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
