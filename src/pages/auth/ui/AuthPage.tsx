import { useState, type KeyboardEvent } from 'react'
import { AsyncButton } from '../../../shared/ui'
import { InstallAppButton } from '../../../features/install-app'

type AuthMode = 'login' | 'signup'

type AuthPageProps = {
  mode: AuthMode
  loginId: string
  email: string
  password: string
  error: string
  notice: string
  onModeChange: (mode: AuthMode) => void
  onLoginIdChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (signupSource?: string) => Promise<unknown>
}

export function AuthPage({
  mode,
  loginId,
  email,
  password,
  error,
  notice,
  onModeChange,
  onLoginIdChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthPageProps) {
  const [signupSource, setSignupSource] = useState('')
  const submitOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.closest('section')?.querySelector<HTMLButtonElement>('.full-btn')?.click()
    }
  }

  return (
    <section className="auth-page" aria-label="로그인 및 회원가입">
      <section className={`auth-card ${mode === 'signup' ? 'signup-mode' : 'login-mode'}`}>
        <div className="auth-head">
          <img src="/logo/logo.png" alt="몰입 스터디" className="auth-logo" />
          <div>
            <p className="eyebrow">Molip Study</p>
            <h1>{mode === 'login' ? '몰입 스크립트' : '계정 만들기'}</h1>
            <p className="muted">
              {mode === 'login'
                ? '다시 오신 걸 환영해요.'
                : '몰입 스크립트에 오신 걸 환영해요.'}
            </p>
          </div>
        </div>

        <div className="auth-mode-tabs" role="group" aria-label="인증 모드">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => onModeChange('login')}>로그인</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => onModeChange('signup')}>회원가입</button>
        </div>

        <label className="field">
          <span>아이디</span>
          <input value={loginId} onChange={(event) => onLoginIdChange(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </label>
        {mode === 'signup' && (
          <label className="field">
            <span>이메일</span>
            <input value={email} onChange={(event) => onEmailChange(event.target.value)} onKeyDown={submitOnEnter} type="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="name@example.com" />
          </label>
        )}
        <label className="field">
          <span>비밀번호</span>
          <input value={password} onChange={(event) => onPasswordChange(event.target.value)} onKeyDown={submitOnEnter} type="password" />
        </label>
        {mode === 'signup' && (
          <label className="field">
            <span>가입 경로 <span className="muted">(선택)</span></span>
            <select value={signupSource} onChange={(event) => setSignupSource(event.target.value)}>
              <option value="">선택하지 않음</option>
              <option value="지인 홍보">지인 홍보</option>
              <option value="커뮤니티">커뮤니티</option>
              <option value="Instagram">Instagram</option>
            </select>
          </label>
        )}
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="notice-text">{notice}</p>}
        <AsyncButton className="primary-btn full-btn" onAction={() => onSubmit(mode === 'signup' ? signupSource : undefined)}>
          {mode === 'login' ? '로그인' : '회원가입'}
        </AsyncButton>
        <InstallAppButton />
      </section>
    </section>
  )
}
