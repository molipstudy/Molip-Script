import { useState } from 'react'
import { Icon, LoadingSkeleton, SkeletonValue } from '../../../shared/ui'
import { date, number } from '../model/member'
import { growth, useAdminMetrics } from '../model/metrics'
import type { Breakdown } from '../model/metrics'
import { MetricsChart } from './MetricsChart'
import './admin.css'
const dimensions = [['requestPath','인기 페이지'],['route','인기 경로'],['referrerHostname','유입 사이트'],['country','방문 국가'],['deviceType','기기'],['browserName','브라우저'],['osName','운영체제'],['utmSource','캠페인 소스'],['utmMedium','캠페인 매체'],['utmCampaign','캠페인'],['utmContent','캠페인 콘텐츠'],['utmTerm','캠페인 검색어']]
const countries = new Intl.DisplayNames(['ko'], { type: 'region' })
function displayLabel(value: string, dimension: string) {
 if (!value) return dimension === 'referrerHostname' ? '직접 방문 / 정보 없음' : '정보 없음'
 if (value === 'Others') return '기타'
 if (dimension === 'country' && /^[A-Z]{2}$/.test(value)) return countries.of(value) || value
 return ({ mobile: '모바일', desktop: '데스크톱', tablet: '태블릿' } as Record<string,string>)[value] || value
}
function Ranking({ rows, dimension, total, loading }: { rows: Breakdown[] | null | undefined; dimension: string; total?: number; loading: boolean }) {
 if (!rows) return loading ? <LoadingSkeleton view="analytics-table" compact /> : <p className="admin-empty">이 통계는 현재 불러올 수 없어요</p>
 if (!rows.length) return <p className="admin-empty">아직 집계된 기록이 없어요</p>
 const max = Math.max(1, ...rows.map(row => row.pageviews))
 return <div className="admin-table-scroll"><table className="metrics-ranking"><thead><tr><th>항목</th><th>방문자</th><th>조회</th><th>조회 비중</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.label}-${index}`}><th scope="row"><span>{displayLabel(row.label, dimension)}</span><i style={{ width: `${row.pageviews / max * 100}%` }} /></th><td>{number(row.visitors)}</td><td>{number(row.pageviews)}</td><td>{total ? `${(row.pageviews / total * 100).toFixed(1)}%` : '—'}</td></tr>)}</tbody></table></div>
}
export function AdminAnalyticsPage() {
 const [days, setDays] = useState(7)
 return <AnalyticsPeriod key={days} days={days} onPeriod={setDays} />
}
function AnalyticsPeriod({ days, onPeriod }: { days: number; onPeriod: (days: number) => void }) {
 const { traffic, overview, trafficError, overviewError, refresh } = useAdminMetrics(days)
 const loading = !traffic && !trafficError
 const [metric, setMetric] = useState<'both'|'visitors'|'pageviews'>('both')
 const period = days === 1 ? '최근 24시간' : `최근 ${days}일`
 const value = (count: number | undefined, pending: boolean) => count === undefined ? pending ? <SkeletonValue /> : '—' : number(count)
 const daily = days === 1 ? traffic?.hourly : traffic?.daily
 return <section className="admin-page">
  <div className="page-top"><div><p className="eyebrow">Analytics</p><h1>방문 통계</h1><p className="page-description">방문 흐름과 유입 경로, 가입 현황을 한눈에 확인하세요.</p></div><button onClick={refresh}><Icon name="reset" />새로고침</button></div>
  <div className="metrics-period" role="group" aria-label="조회 기간">{[1,7,30].map(count => <button key={count} aria-pressed={days === count} onClick={() => onPeriod(count)}>{count === 1 ? '24시간' : `${count}일`}</button>)}</div>
  <div className="admin-overview metrics-overview">
   <article><span>{period} 방문자</span><strong>{value(traffic?.connected ? traffic.visitors : undefined, loading)}</strong><small>{growth(traffic?.connected ? traffic.visitors : undefined, traffic?.previous?.visitors)}</small></article>
   <article><span>{period} 페이지 조회</span><strong>{value(traffic?.connected ? traffic.pageviews : undefined, loading)}</strong><small>{growth(traffic?.connected ? traffic.pageviews : undefined, traffic?.previous?.pageviews)}</small></article>
   <article><span>방문자당 페이지 조회</span><strong>{traffic?.connected && traffic.visitors ? (traffic.pageviews / traffic.visitors).toFixed(2) : '—'}</strong><small>선택한 기간 기준</small></article>
   <article><span>{period} 신규 가입</span><strong>{value(overview?.new_members, !overview && !overviewError)}</strong><small>{growth(overview?.new_members, overview?.previous_new_members)}</small></article>
   <article><span>{period} 신규 스크립트</span><strong>{value(overview?.new_scripts, !overview && !overviewError)}</strong><small>전체 {overview ? number(overview.total_scripts) : '—'}개</small></article>
   <article><span>최근 24시간 방문자</span><strong>{value(traffic?.recent?.visitors, loading)}</strong><small>페이지 조회 {traffic?.recent ? number(traffic.recent.pageviews) : '—'}회</small></article>
  </div>
  <div className="admin-traffic-note" role="status"><span>{trafficError ? '방문 통계를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' : traffic?.connected ? `운영 사이트 · ${date(traffic.since)} ~ ${date(traffic.until)}` : traffic?.message || '방문 통계 확인 중…'}{overviewError && ' 가입·스크립트 통계를 불러오지 못했어요.'}</span><a href="https://vercel.com/z1hxn/molip-script/analytics" target="_blank" rel="noreferrer">Vercel에서 보기 <Icon name="arrow" /></a></div>
  <div className="admin-analytics-panels">
   <section className="metrics-wide"><div className="metrics-panel-top"><h2>방문 추이</h2><div className="metrics-period" role="group" aria-label="그래프 지표">{(['both','visitors','pageviews'] as const).map(item => <button key={item} aria-pressed={metric === item} onClick={() => setMetric(item)}>{{both:'전체',visitors:'방문자',pageviews:'조회'}[item]}</button>)}</div></div>{daily ? <MetricsChart title="방문 추이" hourly={days === 1} timestamps={daily.map(row => row.timestamp)} series={[...(metric !== 'pageviews' ? [{label:'방문자',color:'#7156ed',values:daily.map(row=>row.visitors)}] : []),...(metric !== 'visitors' ? [{label:'페이지 조회',color:'#0c9e94',values:daily.map(row=>row.pageviews)}] : [])]} /> : loading ? <LoadingSkeleton view="analytics-table" compact /> : <p className="admin-empty">방문 추이를 불러올 수 없어요</p>}</section>
   <section><h2>가입자 · 스크립트 증가</h2>{overview ? <MetricsChart title="가입자와 스크립트 증가" timestamps={overview.daily.map(row=>row.timestamp)} series={[{label:'신규 가입',color:'#7156ed',values:overview.daily.map(row=>row.signups)},{label:'신규 스크립트',color:'#e69537',values:overview.daily.map(row=>row.scripts)}]} /> : overviewError ? <p className="admin-empty">가입 통계를 불러올 수 없어요</p> : <LoadingSkeleton view="analytics-table" compact />}</section>
   <section><h2>시간대별 방문</h2><p className="admin-period-label">최근 24시간</p>{traffic?.hourly ? <MetricsChart title="시간대별 방문" hourly timestamps={traffic.hourly.map(row=>row.timestamp)} series={[{label:'방문자',color:'#7156ed',values:traffic.hourly.map(row=>row.visitors)},{label:'페이지 조회',color:'#0c9e94',values:traffic.hourly.map(row=>row.pageviews)}]} /> : loading ? <LoadingSkeleton view="analytics-table" compact /> : <p className="admin-empty">시간대별 통계를 불러올 수 없어요</p>}</section>
   {dimensions.map(([dimension,title]) => <section key={dimension}><h2>{title}</h2><Ranking dimension={dimension} rows={traffic?.breakdowns?.[dimension]} total={traffic?.pageviews} loading={loading} /></section>)}
   <section><h2>신규 가입 경로</h2>{overview ? overview.signup_sources.length ? <ul className="metrics-sources">{overview.signup_sources.map(row => <li key={row.label}><span>{({friend:'지인 홍보',community:'커뮤니티',instagram:'Instagram',other:'기타'} as Record<string,string>)[row.label] || row.label}</span><strong>{number(row.count)}명</strong></li>)}</ul> : <p className="admin-empty">이 기간에 새로 가입한 회원이 없어요</p> : overviewError ? <p className="admin-empty">가입 경로를 불러올 수 없어요</p> : <LoadingSkeleton view="analytics-table" compact />}</section>
  </div>
  <p className="metrics-footnote">방문자는 기간별 고유 방문자 수로, 날짜별·항목별 수치를 더한 값과 다를 수 있어요. 조회 비중은 선택한 기간의 전체 페이지 조회 기준이에요. 일부 항목은 Vercel의 조회 가능 기간과 수집 상태에 따라 제공되지 않을 수 있어요.</p>
 </section>
}
