import type { SentenceStat, SentenceStatRow, ScriptRow, WordStat, WordStatRow } from '../../script'
import type {
  ActiveQuizRow,
  DictationSessionRow,
  FlashcardSessionRow,
  LearningStore,
} from '../model/types'

export const emptyStore = (): LearningStore => ({
  scripts: [],
  sentenceStatsByScript: {},
  wordStatsByScript: {},
  dictationSessions: [],
  flashcardSessions: [],
  activeQuizzes: [],
})

export const normalizeStore = (
  scripts: ScriptRow[],
  sentenceRows: SentenceStatRow[],
  wordRows: WordStatRow[],
  dictationRows: DictationSessionRow[],
  flashcardRows: FlashcardSessionRow[],
  activeQuizRows: ActiveQuizRow[],
): LearningStore => {
  const sentenceStatsByScript: Record<string, Record<string, SentenceStat>> = {}
  const wordStatsByScript: Record<string, WordStat[]> = {}

  sentenceRows.forEach((row) => {
    const bucket = sentenceStatsByScript[row.script_id] ?? {}
    bucket[row.sentence_key] = {
      sentenceKey: row.sentence_key,
      number: row.number,
      meaning: row.meaning,
      english: row.english,
      flashcardUnknownCount: row.flashcard_unknown_count,
      dictationAttempts: row.dictation_attempts,
      dictationWrongCount: row.dictation_wrong_count,
      starred: row.starred,
      lastStudiedAt: row.last_studied_at ?? undefined,
      lastDictationAt: row.last_dictation_at ?? undefined,
    }
    sentenceStatsByScript[row.script_id] = bucket
  })

  wordRows.forEach((row) => {
    const bucket = wordStatsByScript[row.script_id] ?? []
    bucket.push({
      word: row.word,
      source: row.source,
      wrongCount: row.wrong_count,
      lastWrongAt: row.last_wrong_at ?? undefined,
    })
    wordStatsByScript[row.script_id] = bucket
  })

  return {
    scripts: scripts.map((row) => ({
      id: row.id,
      title: row.title,
      rawText: row.raw_text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastOpenedAt: row.last_opened_at,
    })),
    sentenceStatsByScript,
    wordStatsByScript,
    dictationSessions: dictationRows.map((row) => ({
      id: row.id,
      scriptId: row.script_id,
      mode: row.mode,
      createdAt: row.created_at,
      totalQuestions: row.total_questions,
      correctQuestions: row.correct_questions,
      wrongQuestions: row.wrong_questions,
      wrongWords: row.wrong_words ?? [],
    })),
    flashcardSessions: flashcardRows.map((row) => ({
      id: row.id,
      scriptId: row.script_id,
      createdAt: row.created_at,
      totalCards: row.total_cards,
      unknownCards: row.unknown_cards,
      trackedWords: row.tracked_words ?? [],
    })),
    activeQuizzes: activeQuizRows.map((row) => ({
      id: row.id,
      scriptId: row.script_id,
      quizType: row.quiz_type,
      mode: row.mode,
      state: row.state,
      progress: row.progress,
      updatedAt: row.updated_at,
    })),
  }
}
