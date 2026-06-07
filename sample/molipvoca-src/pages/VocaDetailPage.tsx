import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '@/shared/ui/Card'
import EmptyState from '@/shared/ui/EmptyState'
import Icon from '@/shared/ui/Icon'
import PageSkeleton from '@/shared/ui/PageSkeleton'
import type { Word } from '@/shared/types'
import { splitMeanings } from '@/shared/lib/meaning'
import { useVocaStore } from '@/features/voca/model/vocaStore'
import { useStudyStore } from '@/features/study/model/studyStore'
import { useAuthStore } from '@/features/auth/model/authStore'

type AccessRole = 'owner' | 'editor' | 'viewer' | null

type WordStatus = 'mastered' | 'confused' | 'new'

const statusLabel = {
  mastered: '외웠어요',
  confused: '어려워요',
  new: '미분류',
} as const

const nextStatus = (status: WordStatus): WordStatus => {
  if (status === 'new') return 'mastered'
  if (status === 'mastered') return 'confused'
  return 'new'
}

export default function VocaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    currentVoca,
    words,
    fetchVocaSet,
    fetchWords,
    fetchMyRole,
  } = useVocaStore()
  const { fetchProgress, getWordStatus, markWordStatus } = useStudyStore()

  const [accessRole, setAccessRole] = useState<AccessRole>(null)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setPageLoading(false)
        return
      }

      setPageLoading(true)
      setAccessRole(null)
      try {
        const rolePromise = user ? fetchMyRole(id) : Promise.resolve(null)
        const [, , role] = await Promise.all([fetchVocaSet(id), fetchWords(id), rolePromise])
        setAccessRole(role)
      } finally {
        setPageLoading(false)
      }
    }
    void load()
  }, [id, user, fetchVocaSet, fetchWords, fetchMyRole])

  useEffect(() => {
    if (words.length === 0) return
    void fetchProgress(words.map((word) => word.id))
  }, [words, fetchProgress])

  const isOwner = accessRole === 'owner'
  const canEdit = accessRole === 'owner' || accessRole === 'editor'

  const handleAddWord = () => {
    if (!id) return
    if (!user) {
      if (confirm('단어를 추가하려면 로그인이 필요합니다. 로그인 페이지로 이동할까요?')) {
        navigate('/login')
      }
      return
    }
    if (!canEdit) return
    navigate(`/voca/${id}/edit`)
  }

  const handleCycleStatus = async (word: Word) => {
    const current = getWordStatus(word.id) as WordStatus
    await markWordStatus(word.id, nextStatus(current))
  }

  if (pageLoading) {
    return <PageSkeleton variant="detail" cards={4} />
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

  return (
    <div className="space-y-5 pb-24 sm:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{currentVoca.title}</h1>
          <p className="text-sm text-text-secondary mt-1">{words.length}개 단어</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {words.length > 0 && (
          <button
            onClick={() => navigate(`/study/${id}`)}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            <Icon name="play" size={15} />
            학습 시작
          </button>
        )}
        {(canEdit || !user) && (
          <button
            onClick={handleAddWord}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium border border-border bg-bg text-text-secondary hover:border-primary transition-colors"
          >
            <Icon name="edit" size={15} />
            단어 추가
          </button>
        )}
        {isOwner && (
          <button
            onClick={() => navigate(`/voca/${id}/settings`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium border border-border bg-bg text-text-secondary hover:border-primary transition-colors"
          >
            <Icon name="settings" size={15} />
            단어장 설정
          </button>
        )}
      </div>

      {words.length === 0 ? (
        <EmptyState
          icon={<Icon name="file" size={44} />}
          title="등록된 단어가 없습니다"
          description={
            !user
              ? '로그인 후 단어를 추가할 수 있습니다. 비회원은 학습만 가능합니다.'
              : canEdit
                ? '단어 추가 페이지에서 첫 단어를 등록하세요.'
                : '편집 권한이 있는 사용자만 단어를 추가할 수 있습니다.'
          }
        />
      ) : (
        <div className="space-y-2">
          {words.map((word) => {
            const status = getWordStatus(word.id)
            const meanings = splitMeanings(word.meaning)
            return (
              <Card key={word.id} className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{word.word}</span>
                    {word.pos && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{word.pos}</span>
                    )}
                  </div>
                  {meanings.length <= 1 ? (
                    <p className="text-sm text-text-secondary mt-1">{word.meaning}</p>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {meanings.map((meaning) => (
                        <span key={meaning} className="text-xs px-2 py-0.5 rounded-full border border-border bg-bg text-text-secondary">
                          {meaning}
                        </span>
                      ))}
                    </div>
                  )}
                  {word.example && (
                    <p className="text-xs text-text-secondary/80 mt-1">{word.example}</p>
                  )}
                </div>

                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => void handleCycleStatus(word)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                      status === 'mastered'
                        ? 'border-success/30 bg-success/10 text-success'
                        : status === 'confused'
                          ? 'border-danger/30 bg-danger/10 text-danger'
                          : 'border-border text-text-secondary hover:border-primary'
                    }`}
                  >
                    <Icon
                      name={status === 'mastered' ? 'checkCircle' : status === 'confused' ? 'alertCircle' : 'refresh'}
                      size={13}
                    />
                    {statusLabel[status]}
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {words.length > 0 && (
        <div className="sm:hidden fixed bottom-3 left-3 right-3 z-40 pb-[env(safe-area-inset-bottom)]">
          <button
            onClick={() => navigate(`/study/${id}`)}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-2xl font-semibold shadow-lg"
          >
            <Icon name="play" size={15} />
            학습 시작
          </button>
        </div>
      )}
    </div>
  )
}
