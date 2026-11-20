import { Icon, LoadingSkeleton, SkeletonValue } from '../../../shared/ui'
import { useAdminMetrics } from '../model/metrics'
import { date, number } from '../model/member'
import { MetricsChart } from './MetricsChart'
export function DashboardWidgets() {
 const { overview, traffic, overviewError, trafficError, refresh } = useAdminMetrics(7, true)
 const metric = (count: number | undefined, failed: boolean) => count === undefined ? failed ? '—' : <SkeletonValue /> : number(count)
 const waiting = !overview && !overviewError
 const cards = [
  { label: '신규 가입자', count: overview?.new_members, sub: `최근 24시간 ${overview ? number(overview.new_members_24h) : '—'}명`, href: '/admin/members' },
  { label: '새 스크립트', count: overview?.new_scripts, sub: `최근 24시간 ${overview ? number(overview.new_scripts_24h) : '—'}개`, href: '/admin/analytics' },
  { label: '전체 회원', count: overview?.total_members, sub: '현재 등록된 회원', href: '/admin/members' },
  { label: '미답변 문의', count: overview?.waiting_inquiries, sub: `최근 24시간 새 문의 ${overview ? number(overview.new_inquiries_24h) : '—'}건`, href: '/admin/support' },
 ]
 return <div className="dashboard-widgets">
  <div className="metrics-panel-top"><h2>최근 7일 요약</h2><button onClick={refresh}><Icon name="reset" />새로고침</button></div>
  <div className="admin-overview metrics-overview">{cards.map(card => <article key={card.label}><a href={card.href}><span>{card.label}<Icon name="arrow" /></span><strong>{metric(card.count, overviewError)}</strong><small>{card.sub}</small></a></article>)}<article><a href="/admin/analytics"><span>최근 7일 방문자<Icon name="arrow" /></span><strong>{metric(traffic?.connected ? traffic.visitors : undefined, trafficError || Boolean(traffic && !traffic.connected))}</strong><small>24시간 {traffic?.recent ? number(traffic.recent.visitors) : '—'}명</small></a></article><article><a href="/admin/analytics"><span>최근 7일 페이지 조회<Icon name="arrow" /></span><strong>{metric(traffic?.connected ? traffic.pageviews : undefined, trafficError || Boolean(traffic && !traffic.connected))}</strong><small>24시간 {traffic?.recent ? number(traffic.recent.pageviews) : '—'}회</small></a></article></div>
  {(overviewError || trafficError || traffic && !traffic.connected) && <p className="metrics-footnote" role="status">일부 요약을 불러오지 못했어요. 각 메뉴에서 연결 상태를 확인하거나 다시 시도해 주세요.</p>}
  <div className="admin-analytics-panels"><section><h2>방문자 추이</h2>{traffic?.daily ? <MetricsChart title="최근 7일 방문자" timestamps={traffic.daily.map(row=>row.timestamp)} series={[{label:'방문자',color:'#7156ed',values:traffic.daily.map(row=>row.visitors)}]} /> : !traffic && !trafficError ? <LoadingSkeleton view="analytics-table" compact /> : <p className="admin-empty">방문 추이를 불러올 수 없어요</p>}</section><section><h2>신규 가입 · 스크립트 추이</h2>{overview ? <MetricsChart title="최근 7일 신규 가입과 스크립트" timestamps={overview.daily.map(row=>row.timestamp)} series={[{label:'신규 가입',color:'#7156ed',values:overview.daily.map(row=>row.signups)},{label:'새 스크립트',color:'#0c9e94',values:overview.daily.map(row=>row.scripts)}]} /> : waiting ? <LoadingSkeleton view="analytics-table" compact /> : <p className="admin-empty">가입 추이를 불러올 수 없어요</p>}</section></div>
  <div className="dashboard-recent">
   <section><div className="metrics-panel-top"><h2>최근 가입</h2><a href="/admin/members">전체 보기<Icon name="arrow" /></a></div>{overview ? overview.recent_members.length ? overview.recent_members.map(row=><a className="dashboard-recent-row" key={row.id} href={`/admin/members/${row.id}`}><strong>{row.username || '회원'}</strong><small>{date(row.created_at)}</small></a>) : <p className="admin-empty">등록된 회원이 없어요</p> : waiting ? <LoadingSkeleton view="analytics-table" compact /> : <p className="admin-empty">불러오지 못했어요</p>}</section>
   <section><div className="metrics-panel-top"><h2>최근 스크립트</h2><a href="/admin/analytics">통계 보기<Icon name="arrow" /></a></div>{overview ? overview.recent_scripts.length ? overview.recent_scripts.map(row=><a className="dashboard-recent-row" key={row.id} href={`/${encodeURIComponent(row.id)}`}><strong>{row.title}</strong><small>{row.username || '회원'} · {date(row.created_at)}</small></a>) : <p className="admin-empty">등록된 스크립트가 없어요</p> : waiting ? <LoadingSkeleton view="analytics-table" compact /> : <p className="admin-empty">불러오지 못했어요</p>}</section>
   <section><div className="metrics-panel-top"><h2>최근 문의</h2><a href="/admin/support">전체 보기<Icon name="arrow" /></a></div>{overview ? overview.recent_inquiries.length ? overview.recent_inquiries.map(row=><a className="dashboard-recent-row" key={row.id} href="/admin/support"><strong>{row.title}<span className={`inquiry-status ${row.status === 'waiting' ? 'waiting' : ''}`}>{row.status === 'waiting' ? '미답변' : '답변 완료'}</span></strong><small>{row.username || '회원'} · {date(row.updated_at)}</small></a>) : <p className="admin-empty">등록된 문의가 없어요</p> : waiting ? <LoadingSkeleton view="analytics-table" compact /> : <p className="admin-empty">불러오지 못했어요</p>}</section>
  </div>
 </div>
}
