import { MemberLearning } from './MemberLearning'
import { normalizePhone, normalizeUsername, validPhone, validUsername } from '../../../features/account-profile/model/profile'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../shared/api'
import { Icon, LoadingSkeleton } from '../../../shared/ui'
import { date, number } from '../model/member'
import type { Detail } from '../model/member'

export function AdminMemberPage({ memberId, onBack }: { memberId: string; onBack: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [learningKind, setLearningKind] = useState<'scripts' | 'shared' | 'active' | null>(null)
  const [source, setSource] = useState('')
  const [sourceDetail, setSourceDetail] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const saveLock = useRef(false)
  useEffect(() => {
    let active = true
    heading.current?.focus()
    void (async () => {
      const result = await supabase!.rpc('admin_member_detail', { p_user_id: memberId })
      if (!active) return
      if (result.error || !result.data) { setError('회원 정보를 불러올 수 없습니다.'); return }
      setDetail(result.data as Detail)
    })()
    return () => { active = false }
  }, [memberId])
  const save = async () => {
    if (saveLock.current) return
    if (!validUsername(username) || !fullName.trim() || !phone.trim() || !validPhone(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setNotice('닉네임, 이름, 전화번호, 이메일을 확인해 주세요.'); return }
    if (source === '기타' && !sourceDetail.trim()) { setNotice('기타 가입 경로를 입력해 주세요.'); return }
    saveLock.current = true
    setSaving(true)
    setNotice('')
    try {
      const result = await supabase!.rpc('admin_update_member_profile', { p_user_id: memberId, p_username: normalizeUsername(username), p_full_name: fullName.trim(), p_phone_number: normalizePhone(phone), p_signup_source: source || null, p_signup_source_detail: source === '기타' ? sourceDetail.trim() : null })
      if (result.error || !result.data) { setNotice('저장하지 못했습니다. 관리자 편집 API와 권한을 확인해 주세요.'); return }
      let updated = result.data as Detail
      setDetail(updated)
      if (email.trim().toLowerCase() !== updated.email?.toLowerCase()) {
        const { data } = await supabase!.auth.getSession()
        const response = await fetch('/api/admin-member-email', { method: 'POST', headers: { Authorization: `Bearer ${data.session?.access_token || ''}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: memberId, email: email.trim().toLowerCase() }) })
        const payload = await response.json()
        if (!response.ok) { setNotice(`닉네임·이름·전화번호는 저장했지만 이메일은 변경하지 못했어요. ${payload.error || '잠시 후 다시 시도해 주세요.'}`); return }
        const detailResult = await supabase!.rpc('admin_member_detail', { p_user_id: memberId })
        updated = detailResult.error ? { ...updated, email: payload.email, email_confirmed_at: null } : detailResult.data as Detail
        setDetail(updated)
      }
      setEditing(false)
      setNotice('회원 정보를 저장했습니다.')
    } catch { setNotice('저장 결과를 확인하지 못했어요. 새로고침 후 회원 정보를 확인해 주세요.') } finally { saveLock.current = false; setSaving(false) }
  }
  return <section className="admin-page admin-member-page">
    <div className="page-top"><div><button className="text-btn" onClick={onBack} disabled={saving}><Icon name="back" />회원 목록</button><h1 ref={heading} tabIndex={-1}>회원 상세</h1></div>
      {detail?.contact_access && !editing && <button onClick={() => { setUsername(detail.username || ''); setFullName(detail.full_name || ''); setPhone(detail.phone_number || ''); setEmail(detail.email || ''); setSource(detail.signup_source === '미선택' ? '' : detail.signup_source); setSourceDetail(detail.signup_source_detail || ''); setNotice(''); setEditing(true) }}><Icon name="pen" />정보 편집</button>}
    </div>
    {error ? <p role="alert" className="error-text">{error}</p> : !detail ? <LoadingSkeleton view="admin-member" compact /> : <section className="admin-detail">
      <h2>{detail.login_id || '프로필 미등록'}</h2>
      {editing ? <form className="admin-edit-form" onSubmit={event => { event.preventDefault(); void save() }}>
        <p className="page-description">공용 프로필 편집은 전체 서비스 관리자만 저장할 수 있어요.</p><label className="field"><span>닉네임</span><input value={username} maxLength={32} required disabled={saving} onChange={event => setUsername(event.target.value)} /></label>
        <label className="field"><span>이름</span><input required maxLength={80} value={fullName} disabled={saving} onChange={event => setFullName(event.target.value)} /></label>
        <label className="field"><span>전화번호</span><input required type="tel" maxLength={24} value={phone} disabled={saving} onChange={event => setPhone(event.target.value)} /></label>
        <label className="field"><span>이메일</span><input required type="email" maxLength={254} value={email} disabled={saving} onChange={event => setEmail(event.target.value)} /><small>변경한 이메일이 새 로그인 주소가 됩니다.</small></label>
        <label className="field"><span>가입 경로</span><select value={source} disabled={saving} onChange={event => setSource(event.target.value)}><option value="">미선택</option>{['지인 홍보', '커뮤니티', 'Instagram', '기타'].map(value => <option key={value}>{value}</option>)}</select></label>
        {source === '기타' && <label className="field"><span>기타 가입 경로</span><input required maxLength={120} value={sourceDetail} disabled={saving} onChange={event => setSourceDetail(event.target.value)} /></label>}
        <div className="button-row"><button type="submit" className="primary-btn" disabled={saving || !username.trim()} aria-busy={saving}>{saving ? '저장 중…' : '변경 사항 저장'}</button><button type="button" disabled={saving} onClick={() => { setEditing(false); setNotice('') }}>취소</button></div>
      </form> : <dl className="admin-detail-list">{[
        ['유저네임', detail.username || '미등록'], ['이메일', detail.email || '미등록'], ['이름', detail.contact_access === false ? '비공개' : detail.full_name || '미입력'], ['전화번호', detail.contact_access === false ? '비공개' : detail.phone_number || '미입력'], ['UUID', detail.id],
        ['가입 경로', detail.signup_source_detail ? `${detail.signup_source} · ${detail.signup_source_detail}` : detail.signup_source], ['계정 생성', date(detail.created_at)], ['스크립트 가입', date(detail.profile_created_at)],
        ['최근 로그인', date(detail.last_sign_in_at)], ['이메일 인증', date(detail.email_confirmed_at)],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
      {notice && <p role="status">{notice}</p>}
      <h3>몰입 스크립트 활동</h3><div className="admin-detail-counts">
        <button disabled={!detail.contact_access} aria-expanded={learningKind === 'scripts'} onClick={() => setLearningKind(learningKind === 'scripts' ? null : 'scripts')}><span>보유 스크립트</span><strong>{number(detail.script_count)}</strong><Icon name="chevron" /></button>
        <button disabled={!detail.contact_access} aria-expanded={learningKind === 'shared'} onClick={() => setLearningKind(learningKind === 'shared' ? null : 'shared')}><span>공개 스크립트</span><strong>{number(detail.shared_count)}</strong><Icon name="chevron" /></button>
        <button disabled={!detail.contact_access} aria-expanded={learningKind === 'active'} onClick={() => setLearningKind(learningKind === 'active' ? null : 'active')}><span>진행 중 학습</span><strong>{number(detail.active_count)}</strong><Icon name="chevron" /></button>
        <div><span>완료 학습 기록</span><strong>{number(detail.completed_count)}</strong></div>
      </div>
      {learningKind && detail.contact_access && <MemberLearning key={`${memberId}:${learningKind}`} memberId={memberId} kind={learningKind} />}
    </section>}
  </section>
}
