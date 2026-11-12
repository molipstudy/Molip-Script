import type { ActiveDictationState, ActiveFlashcardState, ActiveQuizRecord, LearningStore } from '../../../entities/learning'
import { parseItems, sentenceKeyOf } from '../../../entities/script'

export const learningLabels = { flashcard: '플래시카드', dictation: '받아쓰기', masking: '마스킹 학습' } as const

export function savedPosition(learning: ActiveQuizRecord) {
  const total = learning.quizType === 'dictation'
    ? (learning.state as ActiveDictationState).questions.length
    : (learning.state as ActiveFlashcardState).queue.length
  const position = Math.min(Math.max(learning.state.currentIndex + 1, 0), total)
  return { total, position, percent: total ? Math.round(position / total * 100) : 0 }
}

export function dashboardData(store: LearningStore) {
  const entries = store.scripts.map(script => {
    const active = store.activeQuizzes.filter(quiz => quiz.scriptId === script.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    const sessions = [
      ...store.dictationSessions.filter(session => session.scriptId === script.id).map(session => ({ date: session.createdAt, kind: 'dictation' as const })),
      ...store.flashcardSessions.filter(session => session.scriptId === script.id).map(session => ({ date: session.createdAt, kind: session.quizType ?? 'flashcard' as const })),
    ].sort((a, b) => b.date.localeCompare(a.date))
    const stats = store.sentenceStatsByScript[script.id] ?? {}
    const studiedDates = Object.values(stats).flatMap(stat => [stat.lastStudiedAt, stat.lastDictationAt].filter((date): date is string => Boolean(date)))
    const lastStudiedAt = [...active.map(quiz => quiz.updatedAt), ...sessions.map(session => session.date), ...studiedDates].sort().at(-1)
    const weakCount = parseItems(script.rawText).filter((item, index) => {
      const stat = stats[sentenceKeyOf(item, index)]
      return stat && (stat.flashcardUnknownCount > 0 || stat.dictationWrongCount > 0 || (stat.maskingWrongCount ?? 0) > 0)
    }).length
    return { script, active, lastStudiedAt, latestSession: sessions[0], weakCount }
  })
  return {
    recent: entries.filter(entry => entry.active.length > 0).sort((a, b) => b.active[0].updatedAt.localeCompare(a.active[0].updatedAt)),
    suggested: [...entries].sort((a, b) => b.script.updatedAt.localeCompare(a.script.updatedAt)).slice(0, 3),
    review: entries.filter(entry => entry.weakCount > 0).sort((a, b) => b.weakCount - a.weakCount),
  }
}
