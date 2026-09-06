import type { KeyboardEvent } from 'react'
import { AsyncButton } from '../../../shared/ui'

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
  onSubmit: () => Promise<unknown>
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
  const submitOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.closest('section')?.querySelector<HTMLButtonElement>('.full-btn')?.click()
    }
  }

  return (
    <main className="center-page">
      <section className={`auth-card ${mode === 'signup' ? 'signup-mode' : 'login-mode'}`}>
        <div className="auth-head">
          <img src="/logo/logo.png" alt="몰입 스터디" className="auth-logo" />
          <div>
            <p className="eyebrow">Molip Study</p>
            <h1>{mode === 'login' ? '몰입 스크립트' : '계정 만들기'}</h1>
            <p className="muted">
              {mode === 'login'
                ? '아이디와 비밀번호로 학습 기록을 불러옵니다.'
                : '아이디, 이메일, 비밀번호를 등록합니다.'}
            </p>
          </div>
        </div>

        <div className="auth-mode-tabs" role="group" aria-label="인증 모드">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => onModeChange('login')}>로그인</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => onModeChange('signup')}>회원가입</button>
        </div>

        {mode === 'signup' && (
          <div className="signup-note">
            <strong>회원가입 정보</strong>
            <span>이메일은 로그인과 계정 복구에 사용하고, 아이디는 서비스 안에서 표시됩니다.</span>
          </div>
        )}

        <label className="field">
          <span>아이디</span>
          <input value={loginId} onChange={(event) => onLoginIdChange(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="예: molip01" />
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
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="notice-text">{notice}</p>}
        <AsyncButton className="primary-btn full-btn" onAction={onSubmit}>
          {mode === 'login' ? '로그인' : '회원가입'}
        </AsyncButton>
      </section>
    </main>
  )
}
