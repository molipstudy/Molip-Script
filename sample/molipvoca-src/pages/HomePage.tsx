import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVocaStore } from '@/features/voca/model/vocaStore'
import { useAuthStore } from '@/features/auth/model/authStore'
import Card from '@/shared/ui/Card'
import Modal from '@/shared/ui/Modal'
import EmptyState from '@/shared/ui/EmptyState'
import Icon from '@/shared/ui/Icon'
import PageSkeleton from '@/shared/ui/PageSkeleton'
import { useViewportMode } from '@/shared/lib/useViewportMode'

export default function HomePage() {
  const { user } = useAuthStore()
  const {
    folders,
    vocaSets,
    fetchFolders,
    fetchVocaSets,
    createFolder,
    updateFolder,
    deleteFolder,
    createVocaSet,
  } = useVocaStore()
  const navigate = useNavigate()
  const { isDesktop } = useViewportMode()

  const [showFolderModal, setShowFolderModal] = useState(false)
  const [showVocaModal, setShowVocaModal] = useState(false)
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [folderName, setFolderName] = useState('')
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [newVoca, setNewVoca] = useState({ title: '', description: '', folder_id: '' })

  const reload = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      await Promise.all([fetchFolders(), fetchVocaSets()])
    } finally {
      setLoading(false)
    }
  }, [user, fetchFolders, fetchVocaSets])

  useEffect(() => {
    void reload()
  }, [reload])

  const rootVocas = useMemo(
    () => vocaSets.filter((voca) => !voca.folder_id),
    [vocaSets]
  )

  const folderVocaCountMap = useMemo(() => {
    const map = new Map<string, number>()
    vocaSets.forEach((voca) => {
      if (!voca.folder_id) return
      map.set(voca.folder_id, (map.get(voca.folder_id) || 0) + 1)
    })
    return map
  }, [vocaSets])

  const explorerItems = useMemo(
    () => [
      ...folders.map((folder) => ({
        id: folder.id,
        kind: 'folder' as const,
        updatedAt: new Date(folder.created_at).getTime(),
        folder,
      })),
      ...rootVocas.map((voca) => ({
        id: voca.id,
        kind: 'voca' as const,
        updatedAt: new Date(voca.updated_at).getTime(),
        voca,
      })),
    ].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
      return b.updatedAt - a.updatedAt
    }),
    [folders, rootVocas]
  )

  const handleCreateFolder = async () => {
    const trimmed = folderName.trim()
    if (!trimmed) return

    if (editingFolder) {
      await updateFolder(editingFolder, trimmed)
    } else {
      await createFolder(trimmed)
    }
    setFolderName('')
    setEditingFolder(null)
    setShowFolderModal(false)
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('폴더를 삭제할까요? 폴더 내 단어장은 폴더 해제됩니다.')) return
    await deleteFolder(folderId)
    await fetchVocaSets()
  }

  const handleCreateVoca = async () => {
    const title = newVoca.title.trim()
    if (!title) return
    const id = await createVocaSet({
      title,
      description: newVoca.description.trim(),
      folder_id: newVoca.folder_id || null,
    })
    setNewVoca({ title: '', description: '', folder_id: '' })
    setShowVocaModal(false)
    if (id) navigate(`/voca/${id}`)
  }

  const openFolderModal = () => {
    setShowCreateTypeModal(false)
    setEditingFolder(null)
    setFolderName('')
    setShowFolderModal(true)
  }

  const openVocaModal = () => {
    setShowCreateTypeModal(false)
    setShowVocaModal(true)
  }

  if (loading) {
    return <PageSkeleton variant="home" cards={5} />
  }

  if (!user) {
    return (
      <div className="space-y-4 pb-20 sm:pb-0">
        <Card>
          <EmptyState
            icon={<Icon name="user" size={44} />}
            title="로그인 없이 커뮤니티와 퀴즈를 이용할 수 있어요"
            description="내 단어장 생성/편집은 로그인 후 사용할 수 있습니다."
            action={(
              <div className="inline-flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-1 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
                >
                  <Icon name="user" size={14} />
                  로그인
                </button>
                <button
                  onClick={() => navigate('/community')}
                  className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl border border-border bg-bg text-text-secondary font-medium hover:border-primary transition-colors"
                >
                  <Icon name="users" size={14} />
                  커뮤니티 보기
                </button>
              </div>
            )}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateTypeModal(true)}
          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border border-border bg-surface text-text-secondary font-medium hover:border-primary transition-colors"
        >
          <Icon name="plus" size={15} />
          추가
        </button>
      </div>

      {explorerItems.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Icon name="book" size={44} />}
            title="단어장과 폴더가 없습니다"
            description="추가 버튼으로 첫 단어장 또는 폴더를 만드세요."
            action={(
              <button
                onClick={() => setShowCreateTypeModal(true)}
                className="inline-flex items-center gap-1 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
              >
                <Icon name="plus" size={14} />
                새로 만들기
              </button>
            )}
          />
        </Card>
      ) : isDesktop ? (
        <div className="grid grid-cols-2 gap-4">
          {explorerItems.map((item) => (
            <div key={item.id} className="text-left rounded-3xl border border-border bg-surface p-6 hover:border-primary/40 transition-colors min-h-[190px]">
              <div className="flex justify-end gap-1">
                {item.kind === 'folder' ? (
                  <>
                    <button
                      onClick={() => {
                        setEditingFolder(item.folder.id)
                        setFolderName(item.folder.name)
                        setShowFolderModal(true)
                      }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-text-secondary hover:border-primary transition-colors"
                      title="폴더 수정"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      onClick={() => void handleDeleteFolder(item.folder.id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-text-secondary hover:text-danger hover:border-danger/50 transition-colors"
                      title="폴더 삭제"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate(`/voca/${item.voca.id}/settings`)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-text-secondary hover:border-primary transition-colors"
                    title="단어장 설정"
                  >
                    <Icon name="edit" size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => navigate(item.kind === 'folder' ? `/folder/${item.folder.id}` : `/voca/${item.voca.id}`)}
                className="w-full text-left"
              >
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-xl font-semibold">
                    <Icon name={item.kind === 'folder' ? 'folder' : 'book'} size={18} />
                    <span className="truncate">{item.kind === 'folder' ? item.folder.name : item.voca.title}</span>
                  </div>
                  {item.kind === 'voca' && item.voca.description && (
                    <p className="text-sm text-text-secondary mt-2 line-clamp-3">{item.voca.description}</p>
                  )}
                  {item.kind === 'folder' && (
                    <p className="text-sm text-text-secondary mt-2">
                      {folderVocaCountMap.get(item.folder.id) || 0}개 단어장
                    </p>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {item.kind === 'voca' && item.voca.share_scope === 'public' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary">
                      <Icon name="globe" size={12} />
                      공개
                    </span>
                  )}
                  {item.kind === 'voca' && item.voca.share_scope === 'unlisted' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-bg border border-border text-text-secondary">
                      <Icon name="link" size={12} />
                      일부공개
                    </span>
                  )}
                  <span className="text-xs text-text-secondary">
                    {new Date(item.kind === 'folder' ? item.folder.created_at : item.voca.updated_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {explorerItems.map((item) => (
            <div key={item.id} className="w-full rounded-2xl border border-border bg-surface p-4 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <button
                  onClick={() => navigate(item.kind === 'folder' ? `/folder/${item.folder.id}` : `/voca/${item.voca.id}`)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 text-base font-semibold">
                      <Icon name={item.kind === 'folder' ? 'folder' : 'book'} size={16} />
                      <span className="truncate">{item.kind === 'folder' ? item.folder.name : item.voca.title}</span>
                    </div>
                    {item.kind === 'voca' && item.voca.description && (
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">{item.voca.description}</p>
                    )}
                    {item.kind === 'folder' && (
                      <p className="text-sm text-text-secondary mt-1">
                        {folderVocaCountMap.get(item.folder.id) || 0}개 단어장
                      </p>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {item.kind === 'voca' && item.voca.share_scope === 'public' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        <Icon name="globe" size={12} />
                        공개
                      </span>
                    )}
                    {item.kind === 'voca' && item.voca.share_scope === 'unlisted' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-bg border border-border text-text-secondary">
                        <Icon name="link" size={12} />
                        일부공개
                      </span>
                    )}
                    <span className="text-xs text-text-secondary">
                      {new Date(item.kind === 'folder' ? item.folder.created_at : item.voca.updated_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </button>

                <div className="inline-flex items-center gap-1 shrink-0 pt-0.5">
                  {item.kind === 'folder' ? (
                    <>
                      <button
                        onClick={() => {
                          setEditingFolder(item.folder.id)
                          setFolderName(item.folder.name)
                          setShowFolderModal(true)
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-text-secondary hover:border-primary transition-colors"
                        title="폴더 수정"
                      >
                        <Icon name="edit" size={14} />
                      </button>
                      <button
                        onClick={() => void handleDeleteFolder(item.folder.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-text-secondary hover:text-danger hover:border-danger/50 transition-colors"
                        title="폴더 삭제"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate(`/voca/${item.voca.id}/settings`)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-text-secondary hover:border-primary transition-colors"
                      title="단어장 설정"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                  )}
                  <Icon name="chevronRight" size={16} className="text-text-secondary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreateTypeModal} onClose={() => setShowCreateTypeModal(false)} title="무엇을 추가할까요?">
        <div className="space-y-2">
          <button
            onClick={openVocaModal}
            className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl border border-border text-text hover:border-primary transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <Icon name="book" size={15} />
              단어장 추가
            </span>
            <Icon name="chevronRight" size={14} className="text-text-secondary" />
          </button>
          <button
            onClick={openFolderModal}
            className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl border border-border text-text hover:border-primary transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <Icon name="folder" size={15} />
              폴더 추가
            </span>
            <Icon name="chevronRight" size={14} className="text-text-secondary" />
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showFolderModal}
        onClose={() => {
          setShowFolderModal(false)
          setEditingFolder(null)
          setFolderName('')
        }}
        title={editingFolder ? '폴더 수정' : '새 폴더'}
      >
        <input
          type="text"
          value={folderName}
          onChange={(event) => setFolderName(event.target.value)}
          placeholder="폴더 이름"
          className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-4"
          autoFocus
          onKeyDown={(event) => event.key === 'Enter' && void handleCreateFolder()}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setShowFolderModal(false)
              setEditingFolder(null)
              setFolderName('')
            }}
            className="px-4 py-2 rounded-xl text-text-secondary hover:bg-bg transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => void handleCreateFolder()}
            className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
          >
            {editingFolder ? '수정' : '만들기'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={showVocaModal} onClose={() => setShowVocaModal(false)} title="새 단어장">
        <div className="space-y-3">
          <input
            type="text"
            value={newVoca.title}
            onChange={(event) => setNewVoca((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="단어장 제목"
            className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            autoFocus
          />
          <textarea
            value={newVoca.description}
            onChange={(event) => setNewVoca((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="설명"
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
          <select
            value={newVoca.folder_id}
            onChange={(event) => setNewVoca((prev) => ({ ...prev, folder_id: event.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">폴더 없음</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setShowVocaModal(false)}
            className="px-4 py-2 rounded-xl text-text-secondary hover:bg-bg transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => void handleCreateVoca()}
            className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
          >
            만들기
          </button>
        </div>
      </Modal>
    </div>
  )
}
