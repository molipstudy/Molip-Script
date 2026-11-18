import { useRef, useState } from 'react'
import type { SignupDetails } from '../../../features/account-profile/model/profile'
import { IconButton } from '../../../shared/ui'

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
  onSubmit: (details?: SignupDetails) => Promise<unknown>
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
  const [signupSourceOther, setSignupSourceOther] = useState('')
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const [loginNoticeDismissed, setLoginNoticeDismissed] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const submit = async () => {
    const form = document.getElementById('auth-form') as HTMLFormElement | null
    if (locked.current || !form?.reportValidity()) return
    locked.current = true
    setBusy(true)
    try { await onSubmit(mode === 'signup' ? { fullName, phoneNumber, signupSource, signupSourceOther: signupSource === '기타' ? signupSourceOther.trim() : '' } : undefined) }
    finally { locked.current = false; setBusy(false) }
  }

  return (
    <section className="auth-page" aria-label="로그인 및 회원가입">
      <form id="auth-form" onSubmit={event => { event.preventDefault(); void submit() }} className={`auth-card ${mode === 'signup' ? 'signup-mode' : 'login-mode'}`}>
        <div className="auth-head">
          <img src="/logo/logo.png" alt="몰입 스터디" className="auth-logo" />
          <div>
            <p className="eyebrow">Molip Study</p>
            <h1>{mode === 'login' ? '몰입 스크립트' : '계정 만들기'}</h1>
            <p className="muted">
              {mode === 'login'
                ? '다시 오신 걸 환영해요'
                : '몰입 스크립트에 오신 걸 환영해요'}
            </p>
          {mode === 'signup' && <p className="auth-account-caption">몰입 스터디 통합 계정으로 가입해요</p>}
          </div>
        </div>

        <div className="auth-mode-tabs" role="group" aria-label="인증 모드">
          <button className={mode === 'login' ? 'active' : ''} type="button" disabled={busy} onClick={() => onModeChange('login')}>로그인</button>
          <button className={mode === 'signup' ? 'active' : ''} type="button" disabled={busy} onClick={() => onModeChange('signup')}>회원가입</button>
        </div>

        {mode === 'login' && !loginNoticeDismissed && <div className="auth-login-change" role="status"><div><strong>이메일 로그인으로 변경됐어요</strong><p>기존 아이디 대신 가입한 이메일을 입력해 주세요</p></div><IconButton type="button" icon="close" label="로그인 안내 닫기" onClick={() => setLoginNoticeDismissed(true)} /></div>}
        {mode === 'signup' && <label className="field"><span>유저네임</span><input required name="username" value={loginId} onChange={event => onLoginIdChange(event.target.value)} autoComplete="nickname" maxLength={32} /><small>한글, 영문, 숫자로 나를 표현해 보세요. 커뮤니티에 공개됩니다.</small></label>}
        <label className="field"><span>이메일</span><input required name="email" value={email} onChange={event => onEmailChange(event.target.value)} type="email" autoComplete={mode === 'login' ? 'username' : 'email'} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="name@example.com" /></label>
        <label className="field">
          <span>비밀번호</span>
          <input required minLength={mode === 'signup' ? 6 : undefined} value={password} onChange={(event) => onPasswordChange(event.target.value)} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} name="password" />
        </label>
        {mode === 'signup' && <>
          <label className="field"><span>이름</span><input required name="full_name" autoComplete="name" maxLength={80} value={fullName} onChange={event => setFullName(event.target.value)} /></label>
          <label className="field"><span>전화번호</span><input required name="phone_number" type="tel" autoComplete="tel" maxLength={24} placeholder="01012345678" value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)} /><small>이름과 전화번호는 다른 회원에게 공개되지 않아요.</small></label>
        </>}
        {mode === 'signup' && (
          <label className="field">
            <span>가입 경로</span>
            <select required name="signup_source" value={signupSource} onChange={(event) => setSignupSource(event.target.value)}>
              <option value="" disabled>가입 경로를 선택해 주세요</option>
              <option value="지인 홍보">지인 홍보</option>
              <option value="커뮤니티">커뮤니티</option>
              <option value="Instagram">Instagram</option>
              <option value="기타">기타</option>
            </select>
          </label>
        )}
        {mode === 'signup' && signupSource === '기타' && <label className="field"><span>기타 가입 경로</span><input required name="signup_source_other" value={signupSourceOther} maxLength={120} placeholder="몰입 스터디를 어떻게 알게 되셨나요?" onChange={event => setSignupSourceOther(event.target.value)} /></label>}
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="notice-text">{notice}</p>}
        <button type="submit" className="primary-btn full-btn" disabled={busy} aria-busy={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>
    </section>
  )
}
