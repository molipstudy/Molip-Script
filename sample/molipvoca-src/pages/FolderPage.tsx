import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useVocaStore } from '@/features/voca/model/vocaStore'
import EmptyState from '@/shared/ui/EmptyState'
import Modal from '@/shared/ui/Modal'
import Icon from '@/shared/ui/Icon'
import PageSkeleton from '@/shared/ui/PageSkeleton'
import { useViewportMode } from '@/shared/lib/useViewportMode'
import type { VocaSet } from '@/shared/types'

export default function FolderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { folders, fetchFolders, fetchVocaSets, createVocaSet } = useVocaStore()
  const { isDesktop } = useViewportMode()
  const [vocaSets, setVocaSets] = useState<VocaSet[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const folder = folders.find(f => f.id === id)

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [, sets] = await Promise.all([fetchFolders(), fetchVocaSets(id)])
        setVocaSets(sets)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [id, fetchFolders, fetchVocaSets])

  const handleCreate = async () => {
    if (!newTitle.trim() || !id) return
    const vocaId = await createVocaSet({ title: newTitle, folder_id: id })
    setNewTitle('')
    setShowModal(false)
    if (vocaId) navigate(`/voca/${vocaId}`)
  }

  if (loading) {
    return <PageSkeleton variant="folder" cards={4} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold inline-flex items-center gap-2">
          <Icon name="folder" size={20} />
          {folder?.name || '폴더'}
        </h1>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border border-border bg-surface text-text-secondary font-medium hover:border-primary transition-colors"
        >
          <Icon name="plus" size={15} />
          단어장 추가
        </button>
      </div>

      {vocaSets.length === 0 ? (
        <EmptyState
          icon={<Icon name="book" size={44} />}
          title="단어장이 없습니다"
          description="이 폴더에 단어장을 추가하세요"
        />
      ) : isDesktop ? (
        <div className="grid grid-cols-2 gap-4">
          {vocaSets.map((voca) => (
            <div key={voca.id} className="text-left rounded-3xl border border-border bg-surface p-6 hover:border-primary/40 transition-colors min-h-[190px]">
              <div className="flex justify-end">
                <button
                  onClick={() => navigate(`/voca/${voca.id}/settings`)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-text-secondary hover:border-primary transition-colors"
                  title="단어장 설정"
                >
                  <Icon name="edit" size={14} />
                </button>
              </div>
              <button
                onClick={() => navigate(`/voca/${voca.id}`)}
                className="w-full text-left"
              >
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-xl font-semibold">
                    <Icon name="book" size={18} />
                    <span className="truncate">{voca.title}</span>
                  </div>
                  {voca.description && (
                    <p className="text-sm text-text-secondary mt-2 line-clamp-3">{voca.description}</p>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {voca.share_scope === 'public' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary">
                      <Icon name="globe" size={12} />
                      공개
                    </span>
                  )}
                  {voca.share_scope === 'unlisted' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-bg border border-border text-text-secondary">
                      <Icon name="link" size={12} />
                      일부공개
                    </span>
                  )}
                  <span className="text-xs text-text-secondary">
                    {new Date(voca.updated_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {vocaSets.map((voca) => (
            <div key={voca.id} className="w-full rounded-2xl border border-border bg-surface p-4 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => navigate(`/voca/${voca.id}`)} className="flex-1 min-w-0 text-left">
                  <div className="inline-flex items-center gap-1.5 text-base font-semibold">
                    <Icon name="book" size={16} />
                    <span className="truncate">{voca.title}</span>
                  </div>
                  {voca.description && (
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">{voca.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {voca.share_scope === 'public' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        <Icon name="globe" size={12} />
                        공개
                      </span>
                    )}
                    {voca.share_scope === 'unlisted' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-bg border border-border text-text-secondary">
                        <Icon name="link" size={12} />
                        일부공개
                      </span>
                    )}
                    <span className="text-xs text-text-secondary">
                      {new Date(voca.updated_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </button>

                <div className="inline-flex items-center gap-1 shrink-0 pt-0.5">
                  <button
                    onClick={() => navigate(`/voca/${voca.id}/settings`)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-text-secondary hover:border-primary transition-colors"
                    title="단어장 설정"
                  >
                    <Icon name="edit" size={14} />
                  </button>
                  <Icon name="chevronRight" size={16} className="text-text-secondary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="새 단어장">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="단어장 제목"
          className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-4"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && void handleCreate()}
        />
        <div className="flex gap-2 justify-end">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-text-secondary hover:bg-bg">취소</button>
          <button onClick={() => void handleCreate()} className="px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark">만들기</button>
        </div>
      </Modal>
    </div>
  )
}
