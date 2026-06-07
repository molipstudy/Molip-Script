import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '@/shared/ui/Card'
import EmptyState from '@/shared/ui/EmptyState'
import Icon from '@/shared/ui/Icon'
import PageSkeleton from '@/shared/ui/PageSkeleton'
import { useVocaStore } from '@/features/voca/model/vocaStore'

type AccessRole = 'owner' | 'editor' | 'viewer' | null
type ShareScope = 'private' | 'unlisted' | 'public'

export default function VocaSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    currentVoca,
    folders,
    fetchVocaSet,
    fetchFolders,
    fetchMyRole,
    updateVocaSet,
    deleteVocaSet,
  } = useVocaStore()

  const [accessRole, setAccessRole] = useState<AccessRole>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [folderId, setFolderId] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  const shareUrl = currentVoca ? `${window.location.origin}/shared/${currentVoca.share_token}` : ''
  const shareScope: ShareScope = currentVoca
    ? (currentVoca.share_scope === 'private' ||
      currentVoca.share_scope === 'unlisted' ||
      currentVoca.share_scope === 'public')
      ? currentVoca.share_scope
      : (currentVoca.is_public ? 'public' : 'private')
    : 'private'
  const canShowShareUrl = shareScope !== 'private'
  const isOwner = accessRole === 'owner'

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setPageLoading(false)
        return
      }

      setPageLoading(true)
      setAccessRole(null)
      try {
        const [, , role] = await Promise.all([fetchVocaSet(id), fetchFolders(), fetchMyRole(id)])
        setAccessRole(role)
      } finally {
        setPageLoading(false)
      }
    }
    void load()
  }, [id, fetchVocaSet, fetchFolders, fetchMyRole])

  useEffect(() => {
    if (!currentVoca) return
    setTitle(currentVoca.title)
    setDescription(currentVoca.description || '')
    setFolderId(currentVoca.folder_id || '')
  }, [currentVoca])

  const handleSave = async () => {
    if (!id || !isOwner || saving) return
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('단어장 이름을 입력해주세요.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateVocaSet(id, {
        title: trimmedTitle,
        description: description.trim(),
        folder_id: folderId || null,
      })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangeShareScope = async (nextScope: ShareScope) => {
    if (!id || !currentVoca || !isOwner) return
    if (shareScope === nextScope) return
    setSaving(true)
    setError('')
    try {
      await updateVocaSet(id, { share_scope: nextScope })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '공개 설정 변경에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyShareLink = async () => {
    if (!canShowShareUrl || !shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const handleDelete = async () => {
    if (!id || !isOwner || deleting) return
    if (!confirm('이 단어장을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return
    setDeleting(true)
    try {
      await deleteVocaSet(id)
      navigate('/')
    } finally {
      setDeleting(false)
    }
  }

  if (pageLoading) {
    return <PageSkeleton variant="settings" cards={3} />
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

  if (!isOwner) {
    return (
      <EmptyState
        icon={<Icon name="lock" size={44} />}
        title="단어장 설정 권한이 없습니다"
        description="소유자만 단어장 설정을 변경할 수 있습니다."
      />
    )
  }

  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      <Card className="space-y-3">
        <h2 className="font-semibold">기본 설정</h2>
        <div className="space-y-2">
          <label className="text-xs text-text-secondary">단어장 이름</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="단어장 이름"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-text-secondary">설명</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            placeholder="단어장 설명"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-text-secondary">폴더</label>
          <select
            value={folderId}
            onChange={(event) => setFolderId(event.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">폴더 없음</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-1 px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <Icon name="check" size={14} />
          {saving ? '저장 중...' : '저장'}
        </button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">공유 설정</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => void handleChangeShareScope('private')}
            disabled={saving}
            className={`inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              shareScope === 'private'
                ? 'bg-bg text-text border-primary'
                : 'bg-bg text-text-secondary border-border hover:border-primary'
            }`}
          >
            <Icon name="lock" size={14} />
            비공개
          </button>
          <button
            onClick={() => void handleChangeShareScope('unlisted')}
            disabled={saving}
            className={`inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              shareScope === 'unlisted'
                ? 'bg-bg text-text border-primary'
                : 'bg-bg text-text-secondary border-border hover:border-primary'
            }`}
          >
            <Icon name="link" size={14} />
            일부공개
          </button>
          <button
            onClick={() => void handleChangeShareScope('public')}
            disabled={saving}
            className={`inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              shareScope === 'public'
                ? 'bg-success/10 text-success border-success/30'
                : 'bg-bg text-text-secondary border-border hover:border-primary'
            }`}
          >
            <Icon name="globe" size={14} />
            공개
          </button>
        </div>

        {canShowShareUrl ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg text-xs text-text-secondary"
            />
            <button
              onClick={() => void handleCopyShareLink()}
              className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              <Icon name="link" size={13} />
              {copied ? '복사됨' : '링크 복사'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-text-secondary">일부공개 또는 공개로 변경하면 링크 공유가 가능합니다.</p>
        )}

        {shareScope === 'public' && (
          <p className="text-xs text-text-secondary">공개 단어장은 커뮤니티 탭에도 표시됩니다.</p>
        )}

        <button
          onClick={() => navigate(`/voca/${id}/collaborate`)}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-border text-sm text-text-secondary hover:border-primary transition-colors"
        >
          <Icon name="users" size={14} />
          협업 관리
        </button>
      </Card>

      <Card className="space-y-3 border-danger/30">
        <h2 className="font-semibold text-danger">단어장 삭제</h2>
        <p className="text-sm text-text-secondary">삭제하면 단어와 학습 기록이 함께 제거됩니다.</p>
        <button
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-medium border border-danger/30 text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
        >
          <Icon name="trash" size={14} />
          {deleting ? '삭제 중...' : '단어장 삭제'}
        </button>
      </Card>
    </div>
  )
}
