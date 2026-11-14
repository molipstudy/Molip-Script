import { useEffect, useState } from 'react'
import { supabase } from '../../../shared/api'
import { Icon } from '../../../shared/ui'
import { AdminMemberPage } from './AdminMemberPage'
import './admin.css'

import { date, number } from '../model/member'
import type { MemberList } from '../model/member'
type Traffic = { connected: boolean; message?: string; visitors?: number; pageviews?: number; since?: string; until?: string }

export function AdminPage({ memberId, onSelectMember }: { memberId: string | null; onSelectMember: (id: string | null) => void }) {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [list, setList] = useState<MemberList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [traffic, setTraffic] = useState<Traffic | null>(null)
  const [trafficError, setTrafficError] = useState('')

  useEffect(() => {
    if (memberId) return
    let active = true
    void (async () => {
      const result = await supabase!.rpc('admin_members', { p_search: search, p_page: page, p_source: source })
      if (!active) return
      setLoading(false)
      if (result.error) { setList(null); setError('회원 목록을 불러오지 못했습니다. 권한 또는 연결 상태를 확인해 주세요.'); return }
      setList(result.data as MemberList)
      setError('')
    })()
    return () => { active = false }
  }, [search, source, page, revision, memberId])
  useEffect(() => {
    if (memberId) return
    const controller = new AbortController()
    void (async () => {
      try {
        const { data } = await supabase!.auth.getSession()
        const token = data.session?.access_token
        if (!token) throw new Error()
        const response = await fetch('/api/admin-analytics', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || '방문 통계를 불러오지 못했습니다.')
        if (!controller.signal.aborted) setTraffic(result)
      } catch (err) {
        if (!controller.signal.aborted) setTrafficError(err instanceof Error && err.message ? err.message : '방문 통계를 불러오지 못했습니다.')
      }
    })()
    return () => controller.abort()
  }, [revision, memberId])
  const updateFilters = () => { setLoading(true); setList(null) }
  const refresh = () => { updateFilters(); setError(''); setTraffic(null); setTrafficError(''); setRevision(value => value + 1) }
  if (memberId) return <AdminMemberPage key={memberId} memberId={memberId} onBack={() => onSelectMember(null)} />
  return <section className="admin-page">
    <div className="page-top"><div><p className="eyebrow">Molip Study</p><h1>관리자</h1><p className="page-description">회원과 서비스 현황을 확인하세요.</p></div><button onClick={refresh}><Icon name="reset" />새로고침</button></div>
    <nav className="admin-service-links" aria-label="서비스 관리 바로가기">{[['Vercel', 'https://vercel.com/z1hxn/molip-script'], ['GitHub', 'https://github.com/molipstudy/Molip-Script'], ['Supabase', 'https://supabase.com/dashboard/project/fdmcqpomrywuobbrmnyl']].map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label}<Icon name="arrow" /></a>)}</nav>
    <div className="admin-overview">
      <article><span>조회 가능한 회원</span><strong>{list ? number(list.total_members) : '—'}</strong></article>
      <article><span>몰입 스크립트 회원</span><strong>{list ? number(list.script_members) : '—'}</strong></article>
      <article><span>최근 7일 방문자</span><strong>{traffic?.connected ? number(traffic.visitors!) : '—'}</strong></article>
      <article><span>최근 7일 페이지 조회</span><strong>{traffic?.connected ? number(traffic.pageviews!) : '—'}</strong></article>
    </div>
    <div className="admin-traffic-note" role="status">{trafficError ? '방문 통계를 불러오지 못했습니다. 연결 상태를 확인해 주세요.' : traffic?.connected ? `운영 사이트 · ${date(traffic.since!)} ~ ${date(traffic.until!)}` : traffic?.message || '방문 통계 확인 중…'} <a href="https://vercel.com/z1hxn/molip-script/analytics" target="_blank" rel="noreferrer">Vercel에서 보기 <Icon name="arrow" /></a></div>
    <div className="admin-members-layout">
      <section className="admin-members" aria-labelledby="admin-members-title">
        <h2 id="admin-members-title">회원 목록 {list && <span className="count-badge">{number(list.total)}</span>}</h2>
        <form className="admin-filters" onSubmit={event => { event.preventDefault(); updateFilters(); setPage(0); setSearch(query.trim()); setRevision(value => value + 1) }}>
          <label className="field"><span>회원 검색</span><input value={query} maxLength={200} onChange={event => setQuery(event.target.value)} placeholder="아이디, 이메일 또는 UUID" /></label>
          <label className="field"><span>가입 경로</span><select value={source} onChange={event => { updateFilters(); setPage(0); setSource(event.target.value) }}><option value="">전체</option>{['지인 홍보','커뮤니티','Instagram','미선택'].map(value => <option key={value}>{value}</option>)}</select></label>
          <button className="primary-btn" type="submit">검색</button>
        </form>
        {loading ? <p role="status" className="admin-empty">회원을 불러오는 중…</p> : error ? <p role="alert" className="error-text">{error}</p> : !list?.items.length ? <p className="admin-empty">조건에 맞는 회원이 없습니다.</p> : <div className="admin-member-list">{list.items.map(member => <button key={member.id} className="admin-member" onClick={() => onSelectMember(member.id)}>
          <span className="admin-member-identity"><strong>{member.login_id || '프로필 미등록'}</strong><span>{member.email || '이메일 없음'}</span><small>{date(member.created_at)}</small></span>
          <span className="admin-member-source">{member.signup_source}<Icon name="chevron" /></span>
        </button>)}</div>}
        <div className="admin-pagination"><button disabled={loading || page === 0} onClick={() => { updateFilters(); setPage(value => value - 1) }}>이전</button><span>{page + 1} / {Math.max(1, Math.ceil((list?.total ?? 0) / 25))}</span><button disabled={loading || !list || (page + 1) * 25 >= list.total} onClick={() => { updateFilters(); setPage(value => value + 1) }}>다음</button></div>
      </section>

    </div>
  </section>
}
