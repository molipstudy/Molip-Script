export type QuizItem = {
  number: string
  meaning: string
  english: string
}

export type ScriptRecord = {
  id: string
  title: string
  rawText: string
  createdAt: string
  updatedAt: string
  lastOpenedAt: string
}

export type SentenceStat = {
  sentenceKey: string
  number: string
  meaning: string
  english: string
  flashcardUnknownCount: number
  dictationAttempts: number
  dictationWrongCount: number
  starred: boolean
  lastStudiedAt?: string
  lastDictationAt?: string
}

export type WordStat = {
  word: string
  source: 'dictation' | 'flashcard'
  wrongCount: number
  lastWrongAt?: string
}

export type ScriptRow = {
  id: string
  title: string
  raw_text: string
  created_at: string
  updated_at: string
  last_opened_at: string
}

export type SentenceStatRow = {
  script_id: string
  sentence_key: string
  number: string
  meaning: string
  english: string
  flashcard_unknown_count: number
  dictation_attempts: number
  dictation_wrong_count: number
  starred: boolean
  last_studied_at: string | null
  last_dictation_at: string | null
}

export type WordStatRow = {
  script_id: string
  word: string
  source: 'dictation' | 'flashcard'
  wrong_count: number
  last_wrong_at: string | null
}
