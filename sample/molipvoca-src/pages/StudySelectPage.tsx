import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Card from '@/shared/ui/Card'
import Icon from '@/shared/ui/Icon'
import PageSkeleton from '@/shared/ui/PageSkeleton'
import { useVocaStore } from '@/features/voca/model/vocaStore'
import {
  useStudyStore,
  type ChoiceDisplayOption,
  type StudyDirection,
  type StudyMode,
  type StudySettings,
  type StudySortBy,
  type WordStatus,
} from '@/features/study/model/studyStore'
import type { StudySession } from '@/shared/types'

interface StudyModeOption {
  key: StudyMode
  icon: 'bolt' | 'checkCircle' | 'edit'
  title: string
  desc: string
  min: number
}

const modeOptions: StudyModeOption[] = [
  { key: 'flashcard', icon: 'bolt', title: '플래시카드', desc: '카드로 빠르게 반복', min: 1 },
  { key: 'multiple_choice', icon: 'checkCircle', title: '객관식', desc: '보기에서 정답 선택', min: 4 },
  { key: 'writing', icon: 'edit', title: '주관식', desc: '직접 입력해서 복습', min: 1 },
]

const modeLabel: Record<StudySession['mode'], string> = {
  flashcard: '플래시카드',
  multiple_choice: '객관식',
  writing: '주관식',
}

const statusLabel: Record<WordStatus, string> = {
  new: '미분류',
  confused: '어려워요',
  mastered: '외웠어요',
}

const directionLabel: Record<StudyDirection, string> = {
  eng_to_kor: '영한',
  kor_to_eng: '한영',
  mixed: '섞기',
}

export default function StudySelectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentVoca, words, fetchVocaSet, fetchWords } = useVocaStore()
  const { startStudy, fetchStats, fetchProgress, getWordStatus, progress } = useStudyStore()

  const [activeMode, setActiveMode] = useState<StudyMode>('flashcard')
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [direction, setDirection] = useState<StudyDirection>('eng_to_kor')
  const [questionCount, setQuestionCount] = useState(10)
  const [speak, setSpeak] = useState(false)
  const [loading, setLoading] = useState(true)
  const [statusFilters, setStatusFilters] = useState<WordStatus[]>(['new', 'confused', 'mastered'])
  const [sortBy, setSortBy] = useState<StudySortBy>('random')
  const [choiceDisplay, setChoiceDisplay] = useState<ChoiceDisplayOption>('basic')

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const [, , stats] = await Promise.all([fetchVocaSet(id), fetchWords(id), fetchStats(id)])
        setSessions(stats)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id, fetchVocaSet, fetchWords, fetchStats])

  useEffect(() => {
    if (words.length === 0) return
    void fetchProgress(words.map((word) => word.id))
  }, [words, fetchProgress])

  const progressSize = progress.size

  const statusCounts = useMemo(() => {
    const counts: Record<WordStatus, number> = { new: 0, confused: 0, mastered: 0 }
    if (progressSize >= 0) {
      words.forEach((word) => {
        counts[getWordStatus(word.id)] += 1
      })
    }
    return counts
  }, [words, progressSize, getWordStatus])

  const activeModeConfig = useMemo(
    () => modeOptions.find((mode) => mode.key === activeMode) || modeOptions[0],
    [activeMode]
  )

  const availableWords = useMemo(() => {
    const selected = new Set(statusFilters)
    if (progressSize < 0) return 0
    return words.filter((word) => selected.has(getWordStatus(word.id))).length
  }, [words, statusFilters, progressSize, getWordStatus])

  const effectiveCount = Math.min(Math.max(1, questionCount), Math.max(availableWords, 1))
  const canStart = availableWords >= activeModeConfig.min

  const totalAttempted = sessions.reduce((sum, session) => sum + session.total, 0)
  const totalCorrect = sessions.reduce((sum, session) => sum + session.score, 0)
  const avgAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0

  const handleToggleStatus = (status: WordStatus) => {
    setStatusFilters((prev) => {
      if (prev.includes(status)) {
        if (prev.length === 1) return prev
        return prev.filter((value) => value !== status)
      }
      return [...prev, status]
    })
  }

  const handleStart = (mode: StudyMode) => {
    if (!canStart) return

    const settings: StudySettings = {
      direction,
      questionCount: effectiveCount,
      speak,
      statusFilters,
      sortBy,
      choiceDisplay,
    }
    const selectedCount = startStudy(words, mode, settings)
    if (selectedCount < activeModeConfig.min) return
    navigate(`/study/${id}/${mode}`)
  }

  if (loading) {
    return <PageSkeleton variant="study" cards={5} />
  }

  return (
    <div className="space-y-5 pb-24 sm:pb-0">
      <div>
        <h1 className="text-2xl font-bold">학습 시작</h1>
        <p className="text-text-secondary mt-1 text-sm sm:text-base">
          {currentVoca?.title} · 전체 {words.length}개 단어
        </p>
      </div>

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="p-3 sm:p-4">
          <p className="text-[11px] text-text-secondary">세션 수</p>
          <p className="text-lg sm:text-2xl font-bold mt-1">{sessions.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-[11px] text-text-secondary">누적 정답률</p>
          <p className="text-lg sm:text-2xl font-bold mt-1">{avgAccuracy}%</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-[11px] text-text-secondary">이번 세션 출제 수</p>
          <p className="text-lg sm:text-2xl font-bold mt-1">{effectiveCount}</p>
        </Card>
      </section>

      <Card className="p-3 sm:p-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {modeOptions.map((mode) => {
            const selected = activeMode === mode.key
            const unavailable = availableWords < mode.min
            return (
              <button
                key={mode.key}
                onClick={() => setActiveMode(mode.key)}
                className={`min-w-[130px] flex-1 rounded-xl px-3 py-3 border text-left transition-colors ${
                  selected ? 'border-primary bg-primary/10' : 'border-border bg-bg hover:border-primary/50'
                }`}
              >
                <div className="inline-flex items-center gap-1 text-sm font-semibold">
                  <Icon name={mode.icon} size={15} />
                  {mode.title}
                </div>
                <p className={`text-xs mt-1 ${unavailable ? 'text-danger' : 'text-text-secondary'}`}>
                  {unavailable ? `최소 ${mode.min}개 필요` : mode.desc}
                </p>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold">문제 설정</p>

            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-text-secondary mb-2">문제 방향</p>
              <div className="flex gap-2">
                {(Object.keys(directionLabel) as StudyDirection[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => setDirection(value)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      direction === value ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-text-secondary'
                    }`}
                  >
                    {directionLabel[value]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-text-secondary">문제 개수</p>
                <input
                  type="number"
                  min={1}
                  max={Math.max(availableWords, 1)}
                  value={effectiveCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value) || 1)}
                  className="w-20 px-2 py-1 rounded-lg border border-border bg-bg text-sm text-right"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-text-secondary mb-2">문제 정렬</p>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as StudySortBy)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm"
              >
                <option value="random">랜덤</option>
                <option value="new_first">미분류 우선</option>
                <option value="confused_first">어려워요 우선</option>
                <option value="mastered_first">외웠어요 우선</option>
                <option value="alphabetical">알파벳 순</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">출제 대상</p>

            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-text-secondary mb-2">단어 상태 (다중 선택)</p>
              <div className="space-y-2">
                {(Object.keys(statusLabel) as WordStatus[]).map((status) => (
                  <label key={status} className="flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={statusFilters.includes(status)}
                        onChange={() => handleToggleStatus(status)}
                        className="accent-primary"
                      />
                      {statusLabel[status]}
                    </span>
                    <span className="text-xs text-text-secondary">{statusCounts[status]}개</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border p-3">
              <label className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2">
                  <Icon name="bolt" size={14} />
                  읽어주기
                </span>
                <input
                  type="checkbox"
                  checked={speak}
                  onChange={(event) => setSpeak(event.target.checked)}
                  className="accent-primary"
                />
              </label>
            </div>

            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-text-secondary mb-2">보기에서 보여줄 정보</p>
              <select
                value={choiceDisplay}
                onChange={(event) => setChoiceDisplay(event.target.value as ChoiceDisplayOption)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm"
              >
                <option value="basic">기본 텍스트</option>
                <option value="with_pos">품사 함께</option>
                <option value="with_example">예문 함께</option>
              </select>
            </div>
          </div>
        </div>

        <motion.div
          key={activeMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-border bg-bg p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2">
              <Icon name={activeModeConfig.icon} size={16} className="text-primary" />
              <h2 className="font-semibold">{activeModeConfig.title}</h2>
            </div>
            <span className="text-xs text-text-secondary">선택 가능 {availableWords}개</span>
          </div>
          <p className="text-sm text-text-secondary mt-2">{activeModeConfig.desc}</p>
          {!canStart && (
            <p className="text-xs text-danger mt-2">
              현재 필터 조건에서 출제 가능한 단어가 부족합니다. (최소 {activeModeConfig.min}개 필요)
            </p>
          )}
          <button
            onClick={() => handleStart(activeModeConfig.key)}
            disabled={!canStart}
            className="mt-4 inline-flex items-center gap-1 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="play" size={14} />
            {canStart ? `${activeModeConfig.title} 시작` : '조건을 조정해 주세요'}
          </button>
        </motion.div>
      </Card>

      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <Icon name="clock" size={15} className="text-text-secondary" />
          <h3 className="font-semibold">최근 학습 기록</h3>
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-text-secondary">아직 학습 기록이 없습니다.</p>
        ) : (
          sessions.slice(0, 8).map((session) => (
            <div key={session.id} className="rounded-xl border border-border px-3 py-2.5 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{modeLabel[session.mode]}</p>
                <p className="text-xs text-text-secondary">{new Date(session.created_at).toLocaleString('ko-KR')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{session.score}/{session.total}</p>
                <p className="text-xs text-text-secondary">{session.duration}초</p>
              </div>
            </div>
          ))
        )}
      </Card>

      <div className="sm:hidden fixed bottom-3 left-3 right-3 z-40 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => handleStart(activeModeConfig.key)}
          disabled={!canStart}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-2xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="play" size={14} />
          {canStart ? `${activeModeConfig.title} 시작` : '조건을 조정해 주세요'}
        </button>
      </div>
    </div>
  )
}
