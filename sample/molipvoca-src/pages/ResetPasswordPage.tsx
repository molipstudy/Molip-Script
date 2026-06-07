import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/features/auth/model/authStore'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuthStore()
  const [nextPassword, setNextPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (nextPassword.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    if (nextPassword !== confirmPassword) {
      setError('비밀번호 확인이 일치하지 않습니다.')
      return
    }

    setLoading(true)
    const result = await updatePassword(nextPassword)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess('비밀번호가 변경되었습니다. 로그인 페이지로 이동해 주세요.')
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">비밀번호 재설정</h1>
          <p className="text-text-secondary">새 비밀번호를 입력해 주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-danger/10 text-danger text-sm rounded-lg p-3"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-success/10 text-success text-sm rounded-lg p-3"
            >
              {success}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">새 비밀번호</label>
            <input
              type="password"
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="6자 이상"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">새 비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="비밀번호 다시 입력"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-3 border border-border text-text-secondary font-semibold rounded-xl hover:border-primary transition-colors"
          >
            로그인으로 이동
          </button>
        </form>
      </motion.div>
    </div>
  )
}

