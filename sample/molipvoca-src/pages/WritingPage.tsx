import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import Icon from '@/shared/ui/Icon'
import { useStudyStore } from '@/features/study/model/studyStore'
import { getAnswerText, getPromptLanguage, getPromptText, isAnswerCorrect } from '@/shared/lib/studyText'

export default function WritingPage() {
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
    submitAnswer,
    retryWrongWords,
    finishStudy,
  } = useStudyStore()

  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [saving, setSaving] = useState(false)

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!currentItem || result) return

    const correct = isAnswerCorrect(currentItem, answer)
    setResult(correct ? 'correct' : 'wrong')
    await submitAnswer(correct, correct ? 1 : -1)
    setTimeout(() => {
      setAnswer('')
      setResult(null)
    }, 1000)
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
            <h1 className="text-2xl font-bold">주관식 완료</h1>
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
                  <p className="font-medium text-sm">{wrong.meaning}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{wrong.word}</p>
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
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${((currentIndex + 1) / (total || 1)) * 100}%` }} />
        </div>
      </div>

      <div className="w-full max-w-md text-center mb-8">
        <p className="text-xs text-text-secondary mb-2">{currentItem.direction === 'eng_to_kor' ? '영한' : '한영'}</p>
        <p className="text-sm text-text-secondary mb-2">아래 문항의 정답을 입력하세요</p>
        <p className="text-2xl font-bold">{getPromptText(currentItem)}</p>
        {settings.choiceDisplay === 'with_pos' && currentItem.word.pos && (
          <p className="text-sm text-primary mt-1">{currentItem.word.pos}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <motion.div
          animate={
            result === 'wrong'
              ? { x: [0, -10, 10, -10, 10, 0] }
              : result === 'correct'
                ? { scale: [1, 1.02, 1] }
                : {}
          }
          transition={{ duration: 0.4 }}
        >
          <input
            type="text"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="정답 입력"
            className={`w-full px-6 py-4 rounded-xl border-2 text-center text-xl font-semibold focus:outline-none transition-colors ${
              result === 'correct'
                ? 'border-success bg-success/5 text-success'
                : result === 'wrong'
                  ? 'border-danger bg-danger/5 text-danger'
                  : 'border-border bg-surface text-text focus:border-primary'
            }`}
            autoFocus
            disabled={!!result}
          />
        </motion.div>

        {result === 'wrong' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-danger mt-3">
            정답: <strong>{getAnswerText(currentItem)}</strong>
          </motion.p>
        )}

        {!result && (
          <button type="submit" className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors">
            확인
          </button>
        )}
      </form>
    </div>
  )
}
