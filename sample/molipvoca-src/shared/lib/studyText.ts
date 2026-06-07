import type { StudyItem } from '@/stores/studyStore'
import { splitMeanings } from '@/shared/lib/meaning'

const normalize = (value: string) => value.trim().toLowerCase()

export const getPromptText = (item: StudyItem) => {
  return item.direction === 'eng_to_kor' ? item.word.word : item.word.meaning
}

export const getAnswerText = (item: StudyItem) => {
  return item.direction === 'eng_to_kor' ? item.word.meaning : item.word.word
}

export const getPromptLanguage = (item: StudyItem) => {
  return item.direction === 'eng_to_kor' ? 'en-US' : 'ko-KR'
}

export const isAnswerCorrect = (item: StudyItem, input: string) => {
  const normalizedInput = normalize(input)
  if (!normalizedInput) return false

  if (item.direction === 'eng_to_kor') {
    const answers = splitMeanings(item.word.meaning)
    return answers.some((answer) => normalize(answer) === normalizedInput)
  }

  return normalize(item.word.word) === normalizedInput
}
