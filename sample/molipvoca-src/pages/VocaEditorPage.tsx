import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '@/shared/ui/Card'
import EmptyState from '@/shared/ui/EmptyState'
import Icon from '@/shared/ui/Icon'
import PageSkeleton from '@/shared/ui/PageSkeleton'
import { splitMeanings } from '@/shared/lib/meaning'
import { useVocaStore } from '@/features/voca/model/vocaStore'

type AccessRole = 'owner' | 'editor' | 'viewer' | null

interface VisibleFields {
  word: boolean
  meaning: boolean
  pos: boolean
  example: boolean
}

interface WordDraft {
  word: string
  pos: string
  example: string
}

const initialDraft: WordDraft = {
  word: '',
  pos: '',
  example: '',
}

const initialVisibleFields: VisibleFields = {
  word: true,
  meaning: true,
  pos: true,
  example: false,
}

export default function VocaEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentVoca, words, fetchVocaSet, fetchWords, fetchMyRole, addWord } = useVocaStore()

  const [accessRole, setAccessRole] = useState<AccessRole>(null)
  const [draft, setDraft] = useState<WordDraft>(initialDraft)
  const [meanings, setMeanings] = useState<string[]>([])
  const [meaningInput, setMeaningInput] = useState('')
  const [visibleFields, setVisibleFields] = useState<VisibleFields>(initialVisibleFields)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [savedWord, setSavedWord] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const wordInputRef = useRef<HTMLInputElement | null>(null)
  const meaningInputRef = useRef<HTMLInputElement | null>(null)
  const posInputRef = useRef<HTMLInputElement | null>(null)
  const exampleInputRef = useRef<HTMLInputElement | null>(null)
  const submitButtonRef = useRef<HTMLButtonElement | null>(null)

  const canEdit = accessRole === 'owner' || accessRole === 'editor'

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setPageLoading(false)
        return
      }

      setPageLoading(true)
      setAccessRole(null)
      try {
        const [, , role] = await Promise.all([fetchVocaSet(id), fetchWords(id), fetchMyRole(id)])
        setAccessRole(role)
      } finally {
        setPageLoading(false)
      }
    }
    void load()
  }, [id, fetchVocaSet, fetchWords, fetchMyRole])

  const recentWords = useMemo(
    () => [...words].reverse().slice(0, 20),
    [words]
  )

  const handleToggleField = (field: keyof VisibleFields) => {
    if (field === 'word' || field === 'meaning') return
    setVisibleFields((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const addMeaningsFromRaw = (raw: string) => {
    const candidates = splitMeanings(raw)
    if (candidates.length === 0) return 0

    setMeanings((prev) => {
      const next = [...prev]
      candidates.forEach((meaning) => {
        if (!next.includes(meaning)) next.push(meaning)
      })
      return next
    })
    setMeaningInput('')
    return candidates.length
  }

  const collectFinalMeanings = () => {
    const pending = splitMeanings(meaningInput)
    const merged = [...meanings]
    pending.forEach((meaning) => {
      if (!merged.includes(meaning)) merged.push(meaning)
    })
    return merged
  }

  const focusAfterMeaning = () => {
    if (visibleFields.pos) {
      posInputRef.current?.focus()
      return
    }
    if (visibleFields.example) {
      exampleInputRef.current?.focus()
      return
    }
    submitButtonRef.current?.focus()
  }

  const focusAfterPos = () => {
    if (visibleFields.example) {
      exampleInputRef.current?.focus()
      return
    }
    submitButtonRef.current?.focus()
  }

  const handleSubmit = async () => {
    if (!id || !canEdit || submitting) return

    const finalMeanings = collectFinalMeanings()
    const payload = {
      voca_id: id,
      word: draft.word.trim(),
      meaning: finalMeanings.join(', '),
      pos: visibleFields.pos ? draft.pos.trim() : '',
      example: visibleFields.example ? draft.example.trim() : '',
    }

    if (!payload.word || !payload.meaning) {
      setError('단어와 뜻은 필수입니다.')
      return
    }

    setSubmitting(true)
    setError('')
    setSavedWord('')

    try {
      await addWord(payload)
      setDraft((prev) => ({
        word: '',
        pos: visibleFields.pos ? '' : prev.pos,
        example: visibleFields.example ? '' : prev.example,
      }))
      setMeanings([])
      setMeaningInput('')
      setSavedWord(payload.word)
      wordInputRef.current?.focus()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '단어 추가에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleWordEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    if (event.key !== 'Enter') return
    event.preventDefault()
    meaningInputRef.current?.focus()
  }

  const handleMeaningEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    if (event.key !== 'Enter') return
    event.preventDefault()

    if (meaningInput.trim()) {
      addMeaningsFromRaw(meaningInput)
      return
    }
    focusAfterMeaning()
  }

  const handlePosEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    if (event.key !== 'Enter') return
    event.preventDefault()
    focusAfterPos()
  }

  const handleExampleEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    if (event.key !== 'Enter') return
    event.preventDefault()
    submitButtonRef.current?.focus()
  }

  if (pageLoading) {
    return <PageSkeleton variant="editor" cards={4} />
  }

  if (!currentVoca) {
    return (
      <EmptyState
        icon={<Icon name="xCircle" size={44} />}
        title="단어장을 찾을 수 없습니다"
        description="접근 권한을 확인해주세요."
      />
    )
  }

  if (!canEdit) {
    return (
      <EmptyState
        icon={<Icon name="lock" size={44} />}
        title="편집 권한이 없습니다"
        description="소유자 또는 편집 권한 사용자만 단어를 추가할 수 있습니다."
        action={(
          <button
            onClick={() => navigate(`/voca/${id}`)}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
          >
            <Icon name="chevronLeft" size={14} />
            단어장으로 이동
          </button>
        )}
      />
    )
  }

  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      <Card className="space-y-1">
        <p className="text-sm text-text-secondary">현재 단어장</p>
        <h1 className="text-xl font-bold">{currentVoca.title}</h1>
        <p className="text-sm text-text-secondary">{words.length}개 단어 등록됨</p>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">단어 추가</h2>
          <span className="text-xs text-text-secondary">Enter로 다음 칸 이동</span>
        </div>

        <div className="space-y-2">
          {visibleFields.word && (
            <input
              ref={wordInputRef}
              value={draft.word}
              onChange={(event) => setDraft((prev) => ({ ...prev, word: event.target.value }))}
              onKeyDown={handleWordEnter}
              placeholder="단어"
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
            />
          )}
          {visibleFields.meaning && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  ref={meaningInputRef}
                  value={meaningInput}
                  onChange={(event) => setMeaningInput(event.target.value)}
                  onKeyDown={handleMeaningEnter}
                  placeholder="뜻 (쉼표로 여러 개 입력 가능)"
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button
                  onClick={() => {
                    if (addMeaningsFromRaw(meaningInput) === 0) focusAfterMeaning()
                  }}
                  className="px-4 py-3 rounded-xl border border-border bg-surface text-text-secondary hover:border-primary transition-colors"
                >
                  뜻 추가
                </button>
              </div>
              {meanings.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {meanings.map((meaning) => (
                    <span
                      key={meaning}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-border bg-bg text-text-secondary"
                    >
                      {meaning}
                      <button
                        onClick={() => setMeanings((prev) => prev.filter((item) => item !== meaning))}
                        className="text-text-secondary hover:text-danger"
                        aria-label="뜻 제거"
                      >
                        <Icon name="x" size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-secondary">뜻을 입력하고 Enter 또는 뜻 추가 버튼으로 등록하세요.</p>
              )}
            </div>
          )}
          {visibleFields.pos && (
            <input
              ref={posInputRef}
              value={draft.pos}
              onChange={(event) => setDraft((prev) => ({ ...prev, pos: event.target.value }))}
              onKeyDown={handlePosEnter}
              placeholder="품사 (선택)"
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          )}
          {visibleFields.example && (
            <input
              ref={exampleInputRef}
              value={draft.example}
              onChange={(event) => setDraft((prev) => ({ ...prev, example: event.target.value }))}
              onKeyDown={handleExampleEnter}
              placeholder="예문 (선택)"
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          )}
        </div>

        <button
          ref={submitButtonRef}
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-1 px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="plus" size={15} />
          {submitting ? '추가 중...' : '추가'}
        </button>

        {error && <p className="text-sm text-danger">{error}</p>}
        {savedWord && <p className="text-sm text-success">{savedWord} 추가됨</p>}
      </Card>

      <Card className="space-y-2">
        <h3 className="font-semibold">입력 필드 설정</h3>
        <p className="text-xs text-text-secondary">단어/뜻은 필수이며, 품사와 예문은 필요할 때만 켤 수 있습니다.</p>
        <div className="space-y-2">
          <label className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2">
              <input type="checkbox" checked readOnly className="accent-primary" />
              단어
            </span>
            <span className="text-xs text-text-secondary">필수</span>
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2">
              <input type="checkbox" checked readOnly className="accent-primary" />
              뜻
            </span>
            <span className="text-xs text-text-secondary">필수</span>
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={visibleFields.pos}
                onChange={() => handleToggleField('pos')}
                className="accent-primary"
              />
              품사
            </span>
            <span className="text-xs text-text-secondary">선택</span>
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={visibleFields.example}
                onChange={() => handleToggleField('example')}
                className="accent-primary"
              />
              예문
            </span>
            <span className="text-xs text-text-secondary">선택</span>
          </label>
        </div>
      </Card>

      <Card className="space-y-2">
        <h3 className="font-semibold">최근 추가 단어</h3>
        {recentWords.length === 0 ? (
          <p className="text-sm text-text-secondary">아직 등록된 단어가 없습니다.</p>
        ) : (
          <div className="space-y-1.5">
            {recentWords.map((word) => (
              <div key={word.id} className="rounded-xl border border-border px-3 py-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{word.word}</p>
                  {word.pos && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{word.pos}</span>
                  )}
                </div>
                {splitMeanings(word.meaning).length <= 1 ? (
                  <p className="text-sm text-text-secondary mt-0.5">{word.meaning}</p>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {splitMeanings(word.meaning).map((meaning) => (
                      <span key={meaning} className="text-xs px-2 py-0.5 rounded-full border border-border bg-bg text-text-secondary">
                        {meaning}
                      </span>
                    ))}
                  </div>
                )}
                {word.example && <p className="text-xs text-text-secondary/80 mt-1">{word.example}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
