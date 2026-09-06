import type { QuizItem, ScriptRecord, SentenceStat, WordStat } from '../../script'

export type StudyScope = 'all' | 'weak' | 'starred' | 'range'
export type StudyMode = 'standard' | 'weak' | 'starred' | 'range'

export type TextUnit = { kind: 'text'; token: string }

export type BlankUnit = {
  kind: 'blank'
  blankId: string
  prefix: string
  suffix: string
  answer: string
  width: number
}

export type SentenceUnit = TextUnit | BlankUnit

export type DictationQuestion = {
  item: QuizItem
  sourceIndex: number
  sentenceKey: string
  units: SentenceUnit[]
}

export type DictationGrade = {
  total: number
  correct: number
  checkedById: Record<string, boolean>
  wrongWords: string[]
}

export type ActiveDictationState = {
  questions: DictationQuestion[]
  answersById: Record<string, string>
  gradesByIndex: Record<string, DictationGrade>
  currentIndex: number
}

export type ActiveFlashcardState = {
  queue: number[]
  currentIndex: number
  revealed: boolean
  unknownIndexes: number[]
  trackWords: boolean
}

export type DictationSessionDetail = {
  questions: DictationQuestion[]
  gradesByIndex: Record<string, DictationGrade>
}

export type DictationSessionRecord = {
  id: string
  scriptId: string
  mode: string
  createdAt: string
  totalQuestions: number
  correctQuestions: number
  wrongQuestions: number
  wrongWords: string[]
}

export type FlashcardSessionRecord = {
  id: string
  scriptId: string
  createdAt: string
  totalCards: number
  unknownCards: number
  trackedWords: string[]
}

export type ActiveQuizRecord = {
  id: string
  scriptId: string
  quizType: 'dictation' | 'flashcard'
  mode: StudyMode
  state: ActiveDictationState | ActiveFlashcardState
  progress: number
  updatedAt: string
}

export type LearningStore = {
  scripts: ScriptRecord[]
  sentenceStatsByScript: Record<string, Record<string, SentenceStat>>
  wordStatsByScript: Record<string, WordStat[]>
  dictationSessions: DictationSessionRecord[]
  flashcardSessions: FlashcardSessionRecord[]
  activeQuizzes: ActiveQuizRecord[]
}

export type DictationSessionRow = {
  id: string
  script_id: string
  mode: string
  created_at: string
  total_questions: number
  correct_questions: number
  wrong_questions: number
  wrong_words: string[]
}

export type FlashcardSessionRow = {
  id: string
  script_id: string
  created_at: string
  total_cards: number
  unknown_cards: number
  tracked_words: string[]
}

export type ActiveQuizRow = {
  id: string
  script_id: string
  quiz_type: 'dictation' | 'flashcard'
  mode: StudyMode
  state: ActiveDictationState | ActiveFlashcardState
  progress: number
  updated_at: string
}
