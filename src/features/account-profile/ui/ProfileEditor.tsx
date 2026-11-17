import { useRef, useState } from 'react'
import { supabase } from '../../../shared/api'
import { normalizePhone, normalizeUsername, validPhone, validUsername } from '../model/profile'
import type { AccountProfile } from '../model/profile'
export function ProfileEditor({ profile, onSaved, onCancel }: { profile: AccountProfile; onSaved: (profile: AccountProfile) => void; onCancel: () => void }) {
  const [username, setUsername] = useState(profile.username)
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [phone, setPhone] = useState(profile.phone_number || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const save = async () => {
    if (locked.current) return
    if (!validUsername(username)) { setError('유저네임은 한글, 영문, 숫자와 . _ -를 사용해 2~32자로 입력해 주세요. 첫 글자는 한글, 영문 또는 숫자여야 해요.'); return }
    if (!validPhone(phone)) { setError('전화번호를 확인해 주세요. 국내 휴대전화는 010으로, 해외 번호는 +국가번호로 입력하세요.'); return }
    locked.current = true; setBusy(true); setError('')
    try {
      const { data, error: failure } = await supabase!.rpc('update_my_profile', { p_username: normalizeUsername(username), p_full_name: fullName.trim() || null, p_phone_number: normalizePhone(phone) || null })
      if (failure) { setError(failure.code === '23505' ? '이미 사용 중인 유저네임입니다.' : '저장하지 못했습니다. 입력한 정보와 연결 상태를 확인해 주세요.'); return }
      onSaved(data as AccountProfile)
    } catch { setError('연결하지 못했습니다. 잠시 후 다시 시도해 주세요.') }
    finally { locked.current = false; setBusy(false) }
  }
  return <form className="profile-edit-form" onSubmit={event => { event.preventDefault(); void save() }}>
    <label className="field"><span>로그인 이메일</span><input value={profile.email || ''} readOnly type="email" /><small>이메일은 변경할 수 없어요.</small></label>
    <label className="field"><span>유저네임</span><input required maxLength={32} autoComplete="nickname" value={username} disabled={busy} onChange={event => setUsername(event.target.value)} /><small>커뮤니티에서 사용할 이름이에요.</small></label>
    <label className="field"><span>이름</span><input autoComplete="name" maxLength={80} value={fullName} disabled={busy} onChange={event => setFullName(event.target.value)} /><small>이름과 전화번호는 다른 회원에게 공개되지 않아요.</small></label>
    <label className="field"><span>전화번호</span><input type="tel" autoComplete="tel" placeholder="01012345678" value={phone} maxLength={24} disabled={busy} onChange={event => setPhone(event.target.value)} /></label>
    {error && <p role="alert" className="error-text">{error}</p>}
    <div className="button-row"><button className="primary-btn" type="submit" disabled={busy} aria-busy={busy}>{busy ? '저장 중…' : '저장'}</button><button type="button" disabled={busy} onClick={onCancel}>취소</button></div>
  </form>
}
