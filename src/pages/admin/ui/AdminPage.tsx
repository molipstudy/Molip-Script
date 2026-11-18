import { useEffect, useState } from 'react'
import { supabase } from '../../../shared/api'
import { Icon, LoadingSkeleton, SkeletonValue } from '../../../shared/ui'
import { AdminMemberPage } from './AdminMemberPage'
import './admin.css'

import { date, number } from '../model/member'
import type { MemberList } from '../model/member'
type Counts = { visitors: number; pageviews: number }
type Overview = { total_members: number; new_members_7d: number; new_members_24h: number }
type Traffic = { recent?: Counts | null; pages?: (Counts & { path: string })[] | null; daily?: (Counts & { timestamp: string })[] | null; connected: boolean; message?: string; visitors?: number; pageviews?: number; since?: string; until?: string }

export function AdminPage({ memberId, onSelectMember, onSupport }: { onSupport: () => void; memberId: string | null; onSelectMember: (id: string | null) => void }) {
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
  const [overview, setOverview] = useState<Overview | null>(null)
  const [overviewError, setOverviewError] = useState(false)

  useEffect(() => {
    if (memberId) return
    let active = true
    void (async () => {
      try {
        const result = await supabase!.rpc('admin_member_overview')
        if (active) { setOverview(result.error ? null : result.data as Overview); setOverviewError(Boolean(result.error)) }
      } catch { if (active) { setOverview(null); setOverviewError(true) } }
    })()
    return () => { active = false }
  }, [revision, memberId])

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
  const refresh = () => { updateFilters(); setError(''); setTraffic(null); setTrafficError(''); setOverview(null); setOverviewError(false); setRevision(value => value + 1) }
  if (memberId) return <AdminMemberPage key={memberId} memberId={memberId} onBack={() => onSelectMember(null)} />
  return <section className="admin-page">
    <div className="page-top"><div><p className="eyebrow">Molip Study</p><h1>관리자</h1><p className="page-description">회원과 서비스 현황을 확인하세요.</p></div><button onClick={refresh}><Icon name="reset" />새로고침</button></div>
    <nav className="admin-service-links" aria-label="서비스 관리 바로가기"><button onClick={onSupport}><Icon name="message" />문의함</button>{[['Vercel', 'https://vercel.com/z1hxn/molip-script'], ['GitHub', 'https://github.com/molipstudy/Molip-Script'], ['Supabase', 'https://supabase.com/dashboard/project/fdmcqpomrywuobbrmnyl']].map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label}<Icon name="arrow" /></a>)}</nav>
    <div className="admin-overview">
      <article><span>전체 회원</span><strong>{overview ? number(overview.total_members) : list ? number(list.total_members) : loading ? <SkeletonValue /> : '—'}</strong></article>
      <article><span>최근 7일 신규 가입</span><strong>{overview ? number(overview.new_members_7d) : !overviewError ? <SkeletonValue /> : '—'}</strong><small>{overview ? `최근 24시간 ${number(overview.new_members_24h)}명` : overviewError ? '가입 통계를 불러오지 못했어요' : '확인 중…'}</small></article>
      <article><span>최근 24시간 방문자</span><strong>{traffic?.recent ? number(traffic.recent.visitors) : !traffic && !trafficError ? <SkeletonValue /> : '—'}</strong></article>
      <article><span>최근 24시간 페이지 조회</span><strong>{traffic?.recent ? number(traffic.recent.pageviews) : !traffic && !trafficError ? <SkeletonValue /> : '—'}</strong></article>
      <article><span>최근 7일 방문자</span><strong>{traffic?.connected ? number(traffic.visitors!) : !traffic && !trafficError ? <SkeletonValue /> : '—'}</strong></article>
      <article><span>최근 7일 페이지 조회</span><strong>{traffic?.connected ? number(traffic.pageviews!) : !traffic && !trafficError ? <SkeletonValue /> : '—'}</strong></article>
    </div>
    <div className="admin-traffic-note" role="status">{trafficError ? '방문 통계를 불러오지 못했습니다. 연결 상태를 확인해 주세요.' : traffic?.connected ? `운영 사이트 · ${date(traffic.since!)} ~ ${date(traffic.until!)}` : traffic?.message || '방문 통계 확인 중…'} <a href="https://vercel.com/z1hxn/molip-script/analytics" target="_blank" rel="noreferrer">Vercel에서 보기 <Icon name="arrow" /></a></div>
    <div className="admin-analytics-panels">
      <section aria-labelledby="popular-pages-title"><h2 id="popular-pages-title">최근 7일 인기 페이지</h2>{!traffic?.pages ? trafficError || traffic ? <p className="muted">페이지 통계를 불러오지 못했어요</p> : <LoadingSkeleton view="analytics-table" compact /> : !traffic.pages.length ? <p className="muted">아직 집계된 방문이 없어요</p> : <div className="admin-table-scroll"><table><thead><tr><th>페이지</th><th>방문자</th><th>조회</th></tr></thead><tbody>{traffic.pages.map(row => <tr key={row.path}><th scope="row">{row.path === 'Others' ? '기타 페이지' : row.path}</th><td>{number(row.visitors)}</td><td>{number(row.pageviews)}</td></tr>)}</tbody></table></div>}</section>
      <section aria-labelledby="daily-visits-title"><h2 id="daily-visits-title">일별 방문</h2><p className="admin-period-label">최근 7일 · UTC 기준</p>{!traffic?.daily ? trafficError || traffic ? <p className="muted">일별 통계를 불러오지 못했어요</p> : <LoadingSkeleton view="analytics-table" compact /> : !traffic.daily.length ? <p className="muted">아직 집계된 방문이 없어요</p> : <div className="admin-table-scroll"><table><thead><tr><th>날짜</th><th>방문자</th><th>조회</th></tr></thead><tbody>{traffic.daily.map(row => <tr key={row.timestamp}><th scope="row">{new Date(row.timestamp).toLocaleDateString('ko-KR', { timeZone: 'UTC', month: 'numeric', day: 'numeric' })}</th><td>{number(row.visitors)}</td><td>{number(row.pageviews)}</td></tr>)}</tbody></table></div>}</section>
    </div>
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
