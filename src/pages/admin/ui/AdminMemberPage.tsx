import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../shared/api'
import { Icon } from '../../../shared/ui'
import { date, number } from '../model/member'
import type { Detail } from '../model/member'

export function AdminMemberPage({ memberId, onBack }: { memberId: string; onBack: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [source, setSource] = useState('')
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
    if (saveLock.current || !username.trim()) return
    saveLock.current = true
    setSaving(true)
    setNotice('')
    try {
      const result = await supabase!.rpc('admin_update_member', { p_user_id: memberId, p_username: username.trim(), p_signup_source: source || null })
      if (result.error || !result.data) { setNotice('저장하지 못했습니다. 관리자 편집 API와 권한을 확인해 주세요.'); return }
      setDetail(result.data as Detail)
      setEditing(false)
      setNotice('회원 정보를 저장했습니다.')
    } finally { saveLock.current = false; setSaving(false) }
  }
  return <section className="admin-page admin-member-page">
    <div className="page-top"><div><button className="text-btn" onClick={onBack} disabled={saving}><Icon name="back" />회원 목록</button><h1 ref={heading} tabIndex={-1}>회원 상세</h1></div>
      {detail && !editing && <button onClick={() => { setUsername(detail.username || ''); setSource(detail.signup_source === '미선택' ? '' : detail.signup_source); setNotice(''); setEditing(true) }}><Icon name="pen" />정보 편집</button>}
    </div>
    {error ? <p role="alert" className="error-text">{error}</p> : !detail ? <p role="status" className="admin-empty">회원 정보를 불러오는 중…</p> : <section className="admin-detail">
      <h2>{detail.login_id || '프로필 미등록'}</h2>
      {editing ? <form className="admin-edit-form" onSubmit={event => { event.preventDefault(); void save() }}>
        <p className="page-description">공용 프로필 편집은 전체 서비스 관리자만 저장할 수 있어요.</p><label className="field"><span>표시 이름</span><input value={username} maxLength={80} required disabled={saving} onChange={event => setUsername(event.target.value)} /></label>
        <label className="field"><span>가입 경로</span><select value={source} disabled={saving} onChange={event => setSource(event.target.value)}><option value="">미선택</option>{['지인 홍보', '커뮤니티', 'Instagram'].map(value => <option key={value}>{value}</option>)}</select></label>
        <div className="button-row"><button type="submit" className="primary-btn" disabled={saving || !username.trim()} aria-busy={saving}>{saving ? '저장 중…' : '변경 사항 저장'}</button><button type="button" disabled={saving} onClick={() => { setEditing(false); setNotice('') }}>취소</button></div>
      </form> : <dl className="admin-detail-list">{[
        ['표시 이름', detail.username || '미등록'], ['이메일', detail.email || '미등록'], ['로그인 아이디', detail.login_id || '미등록'], ['UUID', detail.id],
        ['가입 경로', detail.signup_source], ['계정 생성', date(detail.created_at)], ['스크립트 가입', date(detail.profile_created_at)],
        ['최근 로그인', date(detail.last_sign_in_at)], ['이메일 인증', date(detail.email_confirmed_at)],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
      {notice && <p role="status">{notice}</p>}
      <h3>몰입 스크립트 활동</h3><div className="admin-detail-counts">{[
        ['보유 스크립트', detail.script_count], ['공개 스크립트', detail.shared_count], ['진행 중 학습', detail.active_count], ['완료 학습 기록', detail.completed_count],
      ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{number(value as number)}</strong></div>)}</div>
    </section>}
  </section>
}
