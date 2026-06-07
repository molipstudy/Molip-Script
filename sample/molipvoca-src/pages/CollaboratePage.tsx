import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '@/shared/ui/Card'
import EmptyState from '@/shared/ui/EmptyState'
import Icon from '@/shared/ui/Icon'
import PageSkeleton from '@/shared/ui/PageSkeleton'
import { useAuthStore } from '@/features/auth/model/authStore'
import { useVocaStore } from '@/features/voca/model/vocaStore'

type CollaboratorRole = 'editor' | 'viewer'

export default function CollaboratePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    currentVoca,
    collaborators,
    fetchVocaSet,
    fetchCollaborators,
    inviteCollaborator,
    updateCollaboratorRole,
    removeCollaborator,
  } = useVocaStore()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<CollaboratorRole>('viewer')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false)
        return
      }
      setLoading(true)
      await Promise.all([fetchVocaSet(id), fetchCollaborators(id)])
      setLoading(false)
    }

    void load()
  }, [id, fetchVocaSet, fetchCollaborators])

  const isOwner = user?.id === currentVoca?.owner_id

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!id) return

    setError('')
    setSuccess('')
    setSubmitting(true)

    const result = await inviteCollaborator(id, email, role)
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setEmail('')
    setRole('viewer')
    setSuccess('협업자를 초대했습니다.')
  }

  const handleRoleChange = async (collaboratorId: string, nextRole: CollaboratorRole) => {
    await updateCollaboratorRole(collaboratorId, nextRole)
  }

  const handleRemove = async (collaboratorId: string) => {
    if (!confirm('해당 협업자를 제거하시겠습니까?')) return
    await removeCollaborator(collaboratorId)
  }

  if (loading) {
    return <PageSkeleton variant="collaborate" cards={3} />
  }

  if (!currentVoca) {
    return <EmptyState icon={<Icon name="xCircle" size={44} />} title="단어장을 찾을 수 없습니다" description="접근 권한을 확인해주세요." />
  }

  if (!isOwner) {
    return (
      <EmptyState
        icon={<Icon name="lock" size={44} />}
        title="협업 관리 권한이 없습니다"
        description="소유자만 협업자 초대 및 권한 변경이 가능합니다."
        action={(
          <button
            onClick={() => navigate(`/voca/${id}`)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            단어장으로 돌아가기
          </button>
        )}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">협업 관리</h1>
        <p className="text-text-secondary mt-1">{currentVoca.title}</p>
      </div>

      <Card>
        <h2 className="font-semibold mb-4">협업자 초대</h2>
        <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="가입된 이메일 주소"
            className="px-4 py-2.5 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            required
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as CollaboratorRole)}
            className="px-4 py-2.5 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="viewer">viewer (읽기 전용)</option>
            <option value="editor">editor (수정 가능)</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {submitting ? '초대 중...' : '초대'}
          </button>
        </form>
        {error && <p className="text-sm text-danger mt-3">{error}</p>}
        {success && <p className="text-sm text-success mt-3">{success}</p>}
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold">협업자 목록 ({collaborators.length})</h2>
        {collaborators.length === 0 ? (
          <Card>
            <p className="text-sm text-text-secondary">아직 초대한 협업자가 없습니다.</p>
          </Card>
        ) : (
          collaborators.map((collaborator) => (
            <Card key={collaborator.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{collaborator.user?.username || '사용자'}</p>
                <p className="text-sm text-text-secondary truncate">{collaborator.user?.email || '-'}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={collaborator.role}
                  onChange={(event) => handleRoleChange(collaborator.id, event.target.value as CollaboratorRole)}
                  className="px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="viewer">viewer</option>
                  <option value="editor">editor</option>
                </select>
                <button
                  onClick={() => handleRemove(collaborator.id)}
                  className="px-3 py-2 rounded-lg border border-danger/30 text-danger text-sm hover:bg-danger/10 transition-colors"
                >
                  제거
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
