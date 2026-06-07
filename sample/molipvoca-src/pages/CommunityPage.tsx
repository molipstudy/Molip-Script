import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVocaStore } from '@/features/voca/model/vocaStore'
import Card from '@/shared/ui/Card'
import EmptyState from '@/shared/ui/EmptyState'
import Icon from '@/shared/ui/Icon'
import PageSkeleton from '@/shared/ui/PageSkeleton'

export default function CommunityPage() {
  const navigate = useNavigate()
  const { communityVocaSets, fetchCommunityVocaSets } = useVocaStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        await fetchCommunityVocaSets()
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [fetchCommunityVocaSets])

  if (loading) {
    return <PageSkeleton variant="community" cards={4} />
  }

  if (communityVocaSets.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Icon name="users" size={44} />}
          title="커뮤니티에 공개된 단어장이 아직 없습니다"
          description="단어장 설정에서 공개로 변경하면 이곳에 표시됩니다."
        />
      </Card>
    )
  }

  return (
    <div className="space-y-3 pb-20 sm:pb-0">
      {communityVocaSets.map((voca) => (
        <button
          key={voca.id}
          onClick={() => navigate(`/shared/${voca.share_token}`)}
          className="w-full text-left rounded-2xl border border-border bg-surface p-5 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-lg font-semibold">
                <Icon name="book" size={17} />
                <span className="truncate">{voca.title}</span>
              </div>
              {voca.description && (
                <p className="text-sm text-text-secondary mt-1 line-clamp-2">{voca.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
                  <Icon name="globe" size={11} />
                  공개
                </span>
                <span>작성자: {voca.owner?.username || '알 수 없음'}</span>
                <span>{new Date(voca.updated_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
            <Icon name="chevronRight" size={16} className="mt-1 text-text-secondary shrink-0" />
          </div>
        </button>
      ))}
    </div>
  )
}
