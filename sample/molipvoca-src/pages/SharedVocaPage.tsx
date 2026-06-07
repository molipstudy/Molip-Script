import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/features/auth/model/authStore'
import { useVocaStore } from '@/features/voca/model/vocaStore'
import Card from '@/shared/ui/Card'
import EmptyState from '@/shared/ui/EmptyState'
import Icon from '@/shared/ui/Icon'
import PageSkeleton from '@/shared/ui/PageSkeleton'
import { splitMeanings } from '@/shared/lib/meaning'

export default function SharedVocaPage() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentVoca, words, fetchSharedVocaByToken, fetchWords, cloneVocaSet } = useVocaStore()
  const [loading, setLoading] = useState(true)
  const [cloneLoading, setCloneLoading] = useState(false)
  const [cloneError, setCloneError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!shareToken) {
        setLoading(false)
        return
      }
      setLoading(true)
      const voca = await fetchSharedVocaByToken(shareToken)
      if (voca) {
        await fetchWords(voca.id)
      }
      setLoading(false)
    }

    void load()
  }, [shareToken, fetchSharedVocaByToken, fetchWords])

  useEffect(() => {
    if (loading || !currentVoca || !user) return
    if (currentVoca.owner_id !== user.id) return
    navigate(`/voca/${currentVoca.id}`, { replace: true })
  }, [loading, currentVoca, user, navigate])

  const handleClone = async () => {
    if (!currentVoca) return
    if (!user) {
      navigate('/login')
      return
    }

    setCloneError('')
    setCloneLoading(true)
    const newId = await cloneVocaSet(currentVoca.id)
    setCloneLoading(false)

    if (!newId) {
      setCloneError('복제에 실패했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    navigate(`/voca/${newId}`)
  }

  if (loading) {
    return <PageSkeleton variant="shared" cards={4} />
  }

  if (currentVoca && user && currentVoca.owner_id === user.id) {
    return <PageSkeleton variant="detail" cards={3} />
  }

  if (!currentVoca) {
    return (
      <EmptyState
        icon={<Icon name="search" size={44} />}
        title="공유 단어장을 찾을 수 없습니다"
        description="링크가 잘못되었거나 비공개로 변경되었습니다."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{currentVoca.title}</h1>
        {currentVoca.description && (
          <p className="text-text-secondary mt-1">{currentVoca.description}</p>
        )}
        <div className="text-sm text-text-secondary mt-2">
          공유자: {currentVoca.owner?.username || '알 수 없음'} · {words.length}개 단어
        </div>
        {words.length > 0 && (
          <button
            onClick={() => navigate(`/study/${currentVoca.id}`)}
            className="mt-3 inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            <Icon name="play" size={15} />
            이 단어장으로 퀴즈 시작
          </button>
        )}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <p className="font-semibold">이 단어장을 내 계정으로 복제할 수 있습니다.</p>
        <p className="text-sm text-text-secondary mt-1">복제 후에는 내 단어장으로 자유롭게 수정할 수 있습니다.</p>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleClone}
            disabled={cloneLoading}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {cloneLoading ? '복제 중...' : '내 단어장으로 복제'}
          </button>
          {!user && (
            <Link to="/login" className="text-sm text-primary hover:underline">
              로그인 후 복제
            </Link>
          )}
        </div>
        {cloneError && <p className="text-sm text-danger mt-3">{cloneError}</p>}
      </Card>

      {words.length === 0 ? (
        <EmptyState icon={<Icon name="file" size={44} />} title="단어가 없습니다" description="이 단어장은 아직 비어 있습니다." />
      ) : (
        <div className="space-y-2">
          {words.map((word, index) => (
            <motion.div
              key={word.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{word.word}</span>
                      {word.pos && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {word.pos}
                        </span>
                      )}
                    </div>
                    {splitMeanings(word.meaning).length <= 1 ? (
                      <p className="text-sm text-text-secondary mt-1">{word.meaning}</p>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {splitMeanings(word.meaning).map((meaning) => (
                          <span key={meaning} className="text-xs px-2 py-0.5 rounded-full border border-border bg-bg text-text-secondary">
                            {meaning}
                          </span>
                        ))}
                      </div>
                    )}
                    {word.example && (
                      <p className="text-xs text-text-secondary/70 mt-1 italic">{word.example}</p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
