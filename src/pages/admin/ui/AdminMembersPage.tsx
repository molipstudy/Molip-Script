import { useEffect, useState } from 'react'
import { supabase } from '../../../shared/api'
import { Icon, LoadingSkeleton } from '../../../shared/ui'
import { AdminMemberPage } from './AdminMemberPage'
import { date, number } from '../model/member'
import type { MemberList } from '../model/member'

export function AdminMembersPage({ memberId, onSelectMember }: { memberId: string | null; onSelectMember: (id: string | null) => void }) {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [list, setList] = useState<MemberList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (memberId) return
    let active = true
    void (async () => {
      try {
        const result = await supabase!.rpc('admin_members', { p_search: search, p_page: page, p_source: source })
        if (!active) return
        if (result.error) { setList(null); setError('회원 목록을 불러오지 못했어요. 다시 시도해 주세요.'); return }
        setList(result.data as MemberList); setError('')
      } catch { if (active) setError('회원 목록을 불러오지 못했어요. 연결 상태를 확인해 주세요.') }
      finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [search, source, page, revision, memberId])
  const updateFilters = () => { setLoading(true); setList(null) }
  const refresh = () => { updateFilters(); setError(''); setRevision(value => value + 1) }
  if (memberId) return <AdminMemberPage key={memberId} memberId={memberId} onBack={() => onSelectMember(null)} />
  return <section className="admin-page">
    <div className="page-top"><div><p className="eyebrow">Members</p><h1>회원 관리</h1><p className="page-description">회원을 찾고 계정 정보와 학습 현황을 관리하세요.</p></div><button onClick={refresh}><Icon name="reset" />새로고침</button></div>
    <div className="admin-members-layout">
      <section className="admin-members" aria-labelledby="admin-members-title">
        <h2 id="admin-members-title">회원 목록 {list && <span className="count-badge">{number(list.total)}</span>}</h2>
        <form className="admin-filters" onSubmit={event => { event.preventDefault(); updateFilters(); setPage(0); setSearch(query.trim()); setRevision(value => value + 1) }}>
          <label className="field"><span>회원 검색</span><input value={query} maxLength={200} onChange={event => setQuery(event.target.value)} placeholder="유저네임, 이메일 또는 UUID" /></label>
          <label className="field"><span>가입 경로</span><select value={source} onChange={event => { updateFilters(); setPage(0); setSource(event.target.value) }}><option value="">전체</option>{['지인 홍보','커뮤니티','Instagram','기타','미선택'].map(value => <option key={value}>{value}</option>)}</select></label>
          <button className="primary-btn" type="submit">검색</button>
        </form>
        {loading ? <LoadingSkeleton view="member-list" compact /> : error ? <p role="alert" className="error-text">{error}</p> : !list?.items.length ? <p className="admin-empty">조건에 맞는 회원이 없습니다.</p> : <div className="admin-member-list">{list.items.map(member => <button key={member.id} className="admin-member" onClick={() => onSelectMember(member.id)}>
          <span className="admin-member-identity"><strong>{member.username || '프로필 미등록'}</strong><span>{member.email || '이메일 없음'}</span><small>{date(member.created_at)}</small></span>
          <span className="admin-member-source">{member.signup_source}{member.signup_source_detail ? ` · ${member.signup_source_detail}` : ''}<Icon name="chevron" /></span>
        </button>)}</div>}
        <div className="admin-pagination"><button disabled={loading || page === 0} onClick={() => { updateFilters(); setPage(value => value - 1) }}>이전</button><span>{page + 1} / {Math.max(1, Math.ceil((list?.total ?? 0) / 25))}</span><button disabled={loading || !list || (page + 1) * 25 >= list.total} onClick={() => { updateFilters(); setPage(value => value + 1) }}>다음</button></div>
      </section>

    </div>
  </section>
}
