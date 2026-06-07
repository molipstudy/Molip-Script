import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import Icon from '@/shared/ui/Icon'
import { useStudyStore } from '@/features/study/model/studyStore'
import { getAnswerText, getPromptLanguage, getPromptText } from '@/shared/lib/studyText'

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export default function MultipleChoicePage() {
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

  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [saving, setSaving] = useState(false)
  const currentItem = currentItems[currentIndex]
  const wrongCount = answeredCount - score

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

  const choices = useMemo(() => {
    if (!currentItem) return []
    const correct = getAnswerText(currentItem)
    const others = currentItems
      .filter((item) => item.word.id !== currentItem.word.id)
      .sort((a, b) => hashString(`${currentItem.word.id}:${a.word.id}`) - hashString(`${currentItem.word.id}:${b.word.id}`))
      .slice(0, 3)
      .map((item) => getAnswerText(item))
    return [correct, ...others].sort((a, b) => hashString(`${currentItem.word.id}:${a}`) - hashString(`${currentItem.word.id}:${b}`))
  }, [currentItem, currentItems])

  const wrongWords = useMemo(() => {
    const wrongSet = new Set(wrongWordIds)
    return currentItems
      .filter((item) => wrongSet.has(item.word.id))
      .map((item) => item.word)
  }, [currentItems, wrongWordIds])

  const handleSelect = async (choice: string) => {
    if (answered || !currentItem) return
    setSelected(choice)
    setAnswered(true)
    await submitAnswer(choice === getAnswerText(currentItem), choice === getAnswerText(currentItem) ? 1 : -1)
    setTimeout(() => {
      setSelected(null)
      setAnswered(false)
    }, 900)
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
            <h1 className="text-2xl font-bold">객관식 완료</h1>
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
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${((currentIndex + 1) / (total || 1)) * 100}%` }} />
        </div>
      </div>

      <div className="w-full max-w-md text-center mb-8">
        <p className="text-xs text-text-secondary mb-2">{currentItem.direction === 'eng_to_kor' ? '영한' : '한영'}</p>
        <p className="text-3xl font-bold">{getPromptText(currentItem)}</p>
        {settings.choiceDisplay === 'with_pos' && currentItem.word.pos && (
          <p className="text-sm text-primary mt-1">{currentItem.word.pos}</p>
        )}
      </div>

      <div className="w-full max-w-md space-y-3">
        {choices.map((choice, index) => {
          let style = 'bg-surface border-border hover:border-primary'
          const correct = choice === getAnswerText(currentItem)
          if (answered && correct) style = 'bg-success/10 border-success text-success'
          else if (answered && choice === selected && !correct) style = 'bg-danger/10 border-danger text-danger'

          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={!answered ? { scale: 0.98 } : undefined}
              onClick={() => void handleSelect(choice)}
              className={`w-full p-4 rounded-xl border text-left font-medium transition-all ${style}`}
              disabled={answered}
            >
              <p>{choice}</p>
              {settings.choiceDisplay === 'with_example' && (
                <p className="text-xs mt-1 text-text-secondary/80 truncate">{currentItem.word.example || '예문 없음'}</p>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
