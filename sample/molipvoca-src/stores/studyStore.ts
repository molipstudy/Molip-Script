import { create } from 'zustand'
import { apiRequest } from '@/shared/api/http'
import type { Word, WordProgress, StudySession } from '@/shared/types'

export type StudyMode = 'flashcard' | 'multiple_choice' | 'writing'
export type WordStatus = 'mastered' | 'confused' | 'new'
export type StudyDirection = 'eng_to_kor' | 'kor_to_eng' | 'mixed'
export type StudySortBy = 'random' | 'new_first' | 'confused_first' | 'mastered_first' | 'alphabetical'
export type ChoiceDisplayOption = 'basic' | 'with_pos' | 'with_example'

export interface StudySettings {
  direction: StudyDirection
  questionCount: number
  speak: boolean
  statusFilters: WordStatus[]
  sortBy: StudySortBy
  choiceDisplay: ChoiceDisplayOption
}

export interface StudyItem {
  word: Word
  direction: Exclude<StudyDirection, 'mixed'>
}

interface StudyAnswerHistory {
  wordId: string
  correct: boolean
  indexBefore: number
  scoreBefore: number
  answeredBefore: number
  wrongBefore: string[]
  swipeDirection: number
}

interface StudyState {
  currentItems: StudyItem[]
  currentIndex: number
  score: number
  answeredCount: number
  total: number
  startTime: number | null
  mode: StudyMode | null
  settings: StudySettings
  isFinished: boolean
  wrongWordIds: string[]
  answerHistory: StudyAnswerHistory[]
  progress: Map<string, WordProgress>

  startStudy: (words: Word[], mode: StudyMode, settings: StudySettings) => number
  retryWrongWords: () => boolean
  submitAnswer: (correct: boolean, swipeDirection: number) => Promise<void>
  undoLastAnswer: () => Promise<number | null>
  markWordStatus: (wordId: string, status: WordStatus) => Promise<void>
  getWordStatus: (wordId: string) => WordStatus
  finishStudy: (vocaId: string) => Promise<void>
  fetchProgress: (wordIds: string[]) => Promise<void>
  fetchStats: (vocaId: string) => Promise<StudySession[]>
}

const defaultSettings: StudySettings = {
  direction: 'eng_to_kor',
  questionCount: 10,
  speak: false,
  statusFilters: ['new', 'confused', 'mastered'],
  sortBy: 'random',
  choiceDisplay: 'basic',
}

const resolveWordStatus = (progress: WordProgress | undefined): WordStatus => {
  if (!progress) return 'new'
  if (progress.correct_count === progress.wrong_count) return 'new'
  return progress.correct_count > progress.wrong_count ? 'mastered' : 'confused'
}

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)

const clampQuestionCount = (count: number, maxCount: number) => {
  if (maxCount <= 0) return 0
  return Math.min(Math.max(1, count), maxCount)
}

export const useStudyStore = create<StudyState>((set, get) => ({
  currentItems: [],
  currentIndex: 0,
  score: 0,
  answeredCount: 0,
  total: 0,
  startTime: null,
  mode: null,
  settings: defaultSettings,
  isFinished: false,
  wrongWordIds: [],
  answerHistory: [],
  progress: new Map(),

  startStudy: (words, mode, settings) => {
    const nextSettings: StudySettings = {
      ...defaultSettings,
      ...settings,
      statusFilters: settings.statusFilters.length > 0 ? settings.statusFilters : defaultSettings.statusFilters,
    }

    const statusSet = new Set(nextSettings.statusFilters)
    const filtered = words.filter((word) => statusSet.has(get().getWordStatus(word.id)))
    const source = filtered.length > 0 ? filtered : words
    if (source.length === 0) {
      set({
        currentItems: [],
        currentIndex: 0,
        score: 0,
        answeredCount: 0,
        total: 0,
        mode,
        settings: nextSettings,
        isFinished: false,
        wrongWordIds: [],
        answerHistory: [],
      })
      return 0
    }

    let sorted = [...source]
    switch (nextSettings.sortBy) {
      case 'alphabetical':
        sorted.sort((a, b) => a.word.localeCompare(b.word, 'en'))
        break
      case 'new_first':
      case 'confused_first':
      case 'mastered_first': {
        const weight = (status: WordStatus) => {
          if (nextSettings.sortBy === 'new_first') return status === 'new' ? 0 : 1
          if (nextSettings.sortBy === 'confused_first') return status === 'confused' ? 0 : 1
          return status === 'mastered' ? 0 : 1
        }
        sorted.sort((a, b) => {
          const aw = weight(get().getWordStatus(a.id))
          const bw = weight(get().getWordStatus(b.id))
          if (aw !== bw) return aw - bw
          return a.word.localeCompare(b.word, 'en')
        })
        break
      }
      case 'random':
      default:
        sorted = shuffle(sorted)
        break
    }

    const limitedCount = clampQuestionCount(nextSettings.questionCount, sorted.length)
    const selected = sorted.slice(0, limitedCount)
    const items: StudyItem[] = selected.map((word) => ({
      word,
      direction: nextSettings.direction === 'mixed'
        ? (Math.random() > 0.5 ? 'eng_to_kor' : 'kor_to_eng')
        : nextSettings.direction,
    }))

    set({
      currentItems: items,
      currentIndex: 0,
      score: 0,
      answeredCount: 0,
      total: items.length,
      startTime: Date.now(),
      mode,
      settings: {
        ...nextSettings,
        questionCount: items.length,
      },
      isFinished: false,
      wrongWordIds: [],
      answerHistory: [],
    })
    return items.length
  },

  retryWrongWords: () => {
    const { currentItems, wrongWordIds, mode, settings } = get()
    if (!mode || wrongWordIds.length === 0) return false

    const wrongSet = new Set(wrongWordIds)
    const retryItems = currentItems.filter((item) => wrongSet.has(item.word.id))
    if (retryItems.length === 0) return false

    const sortedRetryItems = settings.sortBy === 'random' ? shuffle(retryItems) : retryItems
    set({
      currentItems: sortedRetryItems,
      currentIndex: 0,
      score: 0,
      answeredCount: 0,
      total: sortedRetryItems.length,
      startTime: Date.now(),
      isFinished: false,
      wrongWordIds: [],
      answerHistory: [],
      settings: { ...settings, questionCount: sortedRetryItems.length },
    })
    return true
  },

  submitAnswer: async (correct, swipeDirection) => {
    const {
      currentItems,
      currentIndex,
      score,
      answeredCount,
      total,
      wrongWordIds,
      answerHistory,
    } = get()
    const currentItem = currentItems[currentIndex]
    if (!currentItem) return

    const nextWrong = correct || wrongWordIds.includes(currentItem.word.id)
      ? wrongWordIds
      : [...wrongWordIds, currentItem.word.id]

    const history: StudyAnswerHistory = {
      wordId: currentItem.word.id,
      correct,
      indexBefore: currentIndex,
      scoreBefore: score,
      answeredBefore: answeredCount,
      wrongBefore: [...wrongWordIds],
      swipeDirection,
    }

    const nextIndex = currentIndex + 1
    set({
      score: correct ? score + 1 : score,
      answeredCount: answeredCount + 1,
      wrongWordIds: nextWrong,
      currentIndex: nextIndex >= total ? currentIndex : nextIndex,
      isFinished: nextIndex >= total,
      answerHistory: [...answerHistory, history],
    })

    try {
      await apiRequest('/study/answer', {
        method: 'POST',
        auth: 'optional',
        body: JSON.stringify({ wordId: currentItem.word.id, correct }),
      })
    } catch {
      // Guest mode keeps local quiz flow without server persistence.
    }
  },

  undoLastAnswer: async () => {
    const { answerHistory } = get()
    if (answerHistory.length === 0) return null
    const last = answerHistory[answerHistory.length - 1]

    set({
      currentIndex: last.indexBefore,
      score: last.scoreBefore,
      answeredCount: last.answeredBefore,
      wrongWordIds: [...last.wrongBefore],
      isFinished: false,
      answerHistory: answerHistory.slice(0, -1),
    })

    try {
      await apiRequest('/study/undo-answer', {
        method: 'POST',
        auth: 'optional',
        body: JSON.stringify({ wordId: last.wordId, correct: last.correct }),
      })
    } catch {
      // Guest mode keeps local quiz flow without server persistence.
    }
    return last.swipeDirection
  },

  markWordStatus: async (wordId, status) => {
    try {
      await apiRequest('/study/mark', {
        method: 'POST',
        auth: 'optional',
        body: JSON.stringify({ wordId, status }),
      })
    } catch {
      // Guest mode keeps local status only.
    }

    const progressMap = new Map(get().progress)
    const current = progressMap.get(wordId)
    const now = new Date().toISOString()
    if (!current) {
      progressMap.set(wordId, {
        id: `local-${wordId}`,
        user_id: '',
        word_id: wordId,
        correct_count: status === 'mastered' ? 1 : 0,
        wrong_count: status === 'confused' ? 1 : 0,
        last_reviewed_at: now,
      })
      set({ progress: progressMap })
      return
    }

    progressMap.set(wordId, {
      ...current,
      correct_count: status === 'mastered'
        ? Math.max(current.correct_count, current.wrong_count + 1)
        : status === 'new'
          ? 0
          : current.correct_count,
      wrong_count: status === 'confused'
        ? Math.max(current.wrong_count, current.correct_count + 1)
        : status === 'new'
          ? 0
          : current.wrong_count,
      last_reviewed_at: now,
    })
    set({ progress: progressMap })
  },

  getWordStatus: (wordId) => {
    const progress = get().progress.get(wordId)
    return resolveWordStatus(progress)
  },

  finishStudy: async (vocaId) => {
    const { score, total, startTime, mode } = get()
    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0

    try {
      await apiRequest('/study/sessions', {
        method: 'POST',
        auth: 'optional',
        body: JSON.stringify({
          vocaId,
          mode,
          score,
          total,
          duration,
        }),
      })
    } catch {
      // Guest mode skips saving.
    }
  },

  fetchProgress: async (wordIds) => {
    if (wordIds.length === 0) return
    try {
      const data = await apiRequest<WordProgress[]>(
        `/study/progress?wordIds=${encodeURIComponent(wordIds.join(','))}`,
        { auth: 'optional' }
      )

      const progressMap = new Map<string, WordProgress>()
      data.forEach((progress) => progressMap.set(progress.word_id, progress))
      set({ progress: progressMap })
    } catch {
      set({ progress: new Map() })
    }
  },

  fetchStats: async (vocaId) => {
    try {
      return await apiRequest<StudySession[]>(`/study/sessions?vocaId=${encodeURIComponent(vocaId)}`, { auth: 'optional' })
    } catch {
      return []
    }
  },
}))
