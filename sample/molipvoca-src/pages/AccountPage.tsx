import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@/shared/ui/Card'
import Icon from '@/shared/ui/Icon'
import { useAuthStore } from '@/features/auth/model/authStore'

export default function AccountPage() {
  const navigate = useNavigate()
  const { user, updateProfile, requestEmailChange } = useAuthStore()
  const [draft, setDraft] = useState<{ username?: string; profile_image?: string }>({})
  const [saving, setSaving] = useState(false)
  const [emailSaving, setEmailSaving] = useState(false)
  const [nextEmail, setNextEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailError, setEmailError] = useState('')

  const username = draft.username ?? user?.username ?? ''
  const profileImage = draft.profile_image ?? user?.profile_image ?? ''

  if (!user) {
    return (
      <div className="space-y-4 pb-20 sm:pb-0">
        <Card className="space-y-3">
          <div className="inline-flex items-center gap-2">
            <Icon name="user" size={18} className="text-primary" />
            <h1 className="font-semibold">계정 기능은 로그인 후 사용할 수 있습니다.</h1>
          </div>
          <p className="text-sm text-text-secondary">
            프로필 수정, 내 단어장 관리, 학습 기록 저장을 위해 로그인해 주세요.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
          >
            <Icon name="user" size={14} />
            로그인하러 가기
          </button>
        </Card>
      </div>
    )
  }

  const handleSave = async () => {
    const trimmedName = username.trim()
    if (!trimmedName) {
      setError('이름을 입력하세요.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    const result = await updateProfile({
      username: trimmedName,
      profile_image: profileImage.trim() || null,
    })
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setDraft({})
    setMessage('저장되었습니다.')
  }

  const handleEmailChange = async () => {
    setEmailError('')
    setEmailMessage('')
    setEmailSaving(true)
    const result = await requestEmailChange(nextEmail)
    setEmailSaving(false)
    if (result.error) {
      setEmailError(result.error)
      return
    }
    setNextEmail('')
    setEmailMessage('이메일 변경 확인 메일을 발송했습니다. 메일함에서 인증을 완료해 주세요.')
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="inline-flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-bg border border-border overflow-hidden inline-flex items-center justify-center">
            {profileImage ? (
              <img src={profileImage} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <Icon name="user" size={20} className="text-text-secondary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{user?.username || '사용자'}</p>
            <p className="text-sm text-text-secondary truncate">{user?.email || '-'}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">표시 이름</label>
            <input
              value={username}
              onChange={(event) => setDraft((prev) => ({ ...prev, username: event.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">프로필 이미지 URL</label>
            <input
              value={profileImage}
              onChange={(event) => setDraft((prev) => ({ ...prev, profile_image: event.target.value }))}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}

        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          <Icon name="check" size={14} />
          {saving ? '저장 중...' : '저장'}
        </button>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">이메일 변경</h2>
        <p className="text-sm text-text-secondary">
          새 이메일 주소를 입력하면 변경 확인 메일이 발송됩니다.
        </p>
        <input
          type="email"
          value={nextEmail}
          onChange={(event) => setNextEmail(event.target.value)}
          placeholder="새 이메일 주소"
          className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {emailError && <p className="text-sm text-danger">{emailError}</p>}
        {emailMessage && <p className="text-sm text-success">{emailMessage}</p>}
        <button
          onClick={() => void handleEmailChange()}
          disabled={emailSaving}
          className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          <Icon name="check" size={14} />
          {emailSaving ? '요청 중...' : '이메일 변경 요청'}
        </button>
      </Card>
    </div>
  )
}
