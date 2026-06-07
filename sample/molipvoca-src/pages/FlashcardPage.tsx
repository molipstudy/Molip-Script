import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import Icon from '@/shared/ui/Icon'
import { useStudyStore } from '@/features/study/model/studyStore'
import { getAnswerText, getPromptLanguage, getPromptText } from '@/shared/lib/studyText'

export default function FlashcardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    currentItems,
    currentIndex,
    score,
    answeredCount,
    total,
    settings,
    isFinished,
    wrongWordIds,
    answerHistory,
    submitAnswer,
    undoLastAnswer,
    retryWrongWords,
    finishStudy,
  } = useStudyStore()

  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState(0)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const currentItem = currentItems[currentIndex]
  const wrongCount = answeredCount - score

  const wrongWords = useMemo(() => {
    const wrongSet = new Set(wrongWordIds)
    return currentItems
      .filter((item) => wrongSet.has(item.word.id))
      .map((item) => item.word)
  }, [currentItems, wrongWordIds])

  useEffect(() => {
    if (!settings.speak || !currentItem || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const text = getPromptText(currentItem)
    if (!text) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = getPromptLanguage(currentItem)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
    return () => window.speechSynthesis.cancel()
  }, [currentItem, settings.speak])

  const handleAnswer = async (correct: boolean, swipeDirection: number) => {
    if (!currentItem || submitting) return
    setSubmitting(true)
    setDirection(swipeDirection)
    setFlipped(false)
    await submitAnswer(correct, swipeDirection)
    setSubmitting(false)
  }

  const handleUndo = async () => {
    if (answerHistory.length === 0 || submitting) return
    const lastDirection = await undoLastAnswer()
    if (lastDirection !== null) {
      setDirection(lastDirection)
      setFlipped(false)
    }
  }

  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (submitting) return
    if (info.offset.x > 110) {
      await handleAnswer(true, 1)
      return
    }
    if (info.offset.x < -110) {
      await handleAnswer(false, -1)
    }
  }

  const handleFinish = async () => {
    if (!id || saving) return
    setSaving(true)
    await finishStudy(id)
    navigate(`/study/${id}`)
  }

  if (!currentItem && !isFinished) {
    navigate(`/study/${id}`)
    return null
  }

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="inline-flex items-center gap-2 mb-2">
            <Icon name="checkCircle" size={18} className="text-success" />
            <h1 className="text-2xl font-bold">플래시카드 완료</h1>
          </div>
          <p className="text-sm text-text-secondary">총 {total}문제 중 {score}개 정답</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border p-3">
              <p className="text-[11px] text-text-secondary">전체</p>
              <p className="text-xl font-bold mt-1">{total}</p>
            </div>
            <div className="rounded-xl border border-success/30 bg-success/5 p-3">
              <p className="text-[11px] text-text-secondary">정답</p>
              <p className="text-xl font-bold mt-1 text-success">{score}</p>
            </div>
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-3">
              <p className="text-[11px] text-text-secondary">오답</p>
              <p className="text-xl font-bold mt-1 text-danger">{wrongCount}</p>
            </div>
          </div>
        </div>

        {wrongWords.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-semibold">다시 보기 대상 ({wrongWords.length})</h2>
            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto">
              {wrongWords.map((wrong) => (
                <div key={wrong.id} className="rounded-lg border border-border px-3 py-2">
                  <p className="font-medium text-sm">{wrong.word}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{wrong.meaning}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => retryWrongWords()}
              className="mt-4 inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-primary/30 text-primary font-medium hover:bg-primary/10 transition-colors"
            >
              <Icon name="refresh" size={14} />
              틀린 문제 다시 풀기
            </button>
          </div>
        )}

        <button
          onClick={() => void handleFinish()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
          disabled={saving}
        >
          <Icon name="check" size={14} />
          {saving ? '저장 중...' : '세션 저장하고 돌아가기'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md mb-6">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-lg border border-border px-2.5 py-2 text-center">
            <p className="text-[11px] text-text-secondary">전체</p>
            <p className="font-semibold">{total}</p>
          </div>
          <div className="rounded-lg border border-success/30 bg-success/5 px-2.5 py-2 text-center">
            <p className="text-[11px] text-text-secondary">정답</p>
            <p className="font-semibold text-success">{score}</p>
          </div>
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-2.5 py-2 text-center">
            <p className="text-[11px] text-text-secondary">오답</p>
            <p className="font-semibold text-danger">{wrongCount}</p>
          </div>
        </div>
        <div className="flex justify-between text-sm text-text-secondary mb-2">
          <span>{currentIndex + 1} / {total}</span>
          <span>{Math.round((answeredCount / (total || 1)) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${((currentIndex + 1) / (total || 1)) * 100}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentIndex}:${currentItem.direction}`}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.35}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, x: direction * 110 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * 130 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md"
        >
          <div
            onClick={() => setFlipped((prev) => !prev)}
            className="bg-surface rounded-2xl border border-border p-8 min-h-[260px] flex flex-col items-center justify-center cursor-pointer select-none shadow-sm hover:shadow-md transition-shadow"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={flipped ? 'back' : 'front'}
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: -90 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                {!flipped ? (
                  <>
                    <p className="text-xs text-text-secondary mb-2">
                      {currentItem.direction === 'eng_to_kor' ? '영한' : '한영'}
                    </p>
                    <p className="text-3xl font-bold mb-2">{getPromptText(currentItem)}</p>
                    {settings.choiceDisplay === 'with_pos' && currentItem.word.pos && (
                      <p className="text-sm text-primary">{currentItem.word.pos}</p>
                    )}
                    <p className="text-xs text-text-secondary mt-4">좌우로 스와이프하거나 버튼으로 채점</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold mb-2">{getAnswerText(currentItem)}</p>
                    {settings.choiceDisplay === 'with_example' && currentItem.word.example && (
                      <p className="text-sm text-text-secondary mt-2">{currentItem.word.example}</p>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-2 mt-8">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => void handleAnswer(false, -1)}
          disabled={submitting}
          className="inline-flex items-center gap-1 px-5 py-3 rounded-xl font-semibold bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors disabled:opacity-50"
        >
          <Icon name="alertCircle" size={15} />
          어려워요
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => void handleUndo()}
          disabled={answerHistory.length === 0 || submitting}
          className="inline-flex items-center justify-center w-11 h-11 rounded-xl font-semibold border border-border text-text-secondary hover:border-primary transition-colors disabled:opacity-40"
        >
          <Icon name="undo" size={16} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => void handleAnswer(true, 1)}
          disabled={submitting}
          className="inline-flex items-center gap-1 px-5 py-3 rounded-xl font-semibold bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-colors disabled:opacity-50"
        >
          <Icon name="checkCircle" size={15} />
          외웠어요
        </motion.button>
      </div>
    </div>
  )
}
