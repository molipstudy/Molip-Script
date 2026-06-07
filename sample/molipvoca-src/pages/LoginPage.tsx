import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/features/auth/model/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [resetting, setResetting] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, requestPasswordReset } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/')
    }
  }

  const handleResetPassword = async () => {
    setResetError('')
    setResetMessage('')
    setResetting(true)
    const result = await requestPasswordReset(email)
    setResetting(false)
    if (result.error) {
      setResetError(result.error)
      return
    }
    setResetMessage('비밀번호 재설정 메일을 보냈습니다. 메일함을 확인해 주세요.')
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">로그인</h1>
          <p className="text-text-secondary">기존 계정으로 학습을 이어가세요</p>
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

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="이메일 주소 입력"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => void handleResetPassword()}
              disabled={resetting}
              className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
            >
              {resetting ? '재설정 메일 전송 중...' : '비밀번호를 잊으셨나요?'}
            </button>
            {resetError && (
              <p className="mt-2 text-sm text-danger">{resetError}</p>
            )}
            {resetMessage && (
              <p className="mt-2 text-sm text-success">{resetMessage}</p>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-text-secondary mt-4">
          계정이 없으신가요?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
