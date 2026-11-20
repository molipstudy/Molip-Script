import type { ReactNode } from 'react'

const Block = ({ shape = 'line' }: { shape?: string }) => <span className={`skeleton-block sk-${shape}`} />
const repeat = (count: number, render: (index: number) => ReactNode) => Array.from({ length: count }, (_, index) => <div key={index}>{render(index)}</div>)
const Heading = () => <div className="skeleton-heading"><div><Block shape="eyebrow" /><Block shape="title" /><Block shape="description" /></div><Block shape="button" /></div>
const Stats = ({ count = 3 }: { count?: number }) => <div className={`sk-stats sk-stats-${count}`}>{repeat(count, () => <div className="skeleton-panel sk-stat"><Block shape="description" /><Block shape="value" /></div>)}</div>
const Fields = ({ count = 5 }: { count?: number }) => <div className="sk-fields">{repeat(count, () => <div className="sk-field-row"><Block shape="label" /><Block shape="description" /></div>)}</div>
const Rows = ({ count = 5 }: { count?: number }) => <div className="sk-library">{repeat(count, () => <div className="skeleton-panel sk-library-row"><Block shape="cover" /><div><Block shape="sentence" /><Block shape="description" /></div></div>)}</div>
const Toolbar = () => <div className="sk-toolbar"><Block shape="eyebrow" /><Block shape="search" /></div>
const Table = () => <div className="sk-table">{repeat(5, () => <div className="sk-table-row"><Block shape="description" /><Block shape="label" /><Block shape="label" /></div>)}</div>
const LearningCards = () => <div className="sk-learning-grid">{repeat(3, () => <div className="skeleton-panel sk-learning-card"><Block shape="eyebrow" /><Block shape="sentence" /><Block shape="description" /><Block shape="progress" /><Block shape="button" /></div>)}</div>
const Community = () => <div className="sk-community-grid">{repeat(4, () => <div className="skeleton-panel sk-community-card"><Block shape="cover" /><Block shape="sentence" /><Block shape="description" /><Block shape="description" /></div>)}</div>
const MemberList = () => <div className="sk-member-list">{repeat(5, () => <div className="sk-member-row"><div><Block shape="sentence" /><Block shape="description" /><Block shape="label" /></div><Block shape="badge" /></div>)}</div>
const Study = ({ view }: { view: string }) => <><Block shape="progress" /><div className={`skeleton-panel sk-study sk-study-${view}`}><Block shape="eyebrow" /><Block shape="sentence" /><Block shape="sentence short" />{view === 'dictation' && <div className="sk-blanks">{repeat(3, () => <Block shape="input" />)}</div>}{view === 'masking' && <div className="sk-mask-tokens">{repeat(12, index => <Block shape={index % 3 === 0 ? 'token wide' : 'token'} />)}</div>}{view === 'flashcard' && <Block shape="description" />}</div><div className="sk-study-actions"><Block shape="button" /><Block shape="button" /></div></>

const labels: Record<string, string> = {
  support: '문의 목록', 'admin-support': '문의함', 'support-detail': '문의 대화', home: '학습 홈', about: '서비스 소개', library: '내 스크립트', continue: '학습 이어하기',
  auth: '로그인', profile: '내 정보', 'profile-fields': '회원 정보', publisher: '게시자 프로필',
  'admin-analytics': '방문 통계', 'admin-members': '회원 관리', admin: '관리자 대시보드', 'admin-member': '회원 상세', 'member-list': '회원 목록', 'analytics-table': '방문 통계',
  community: '커뮤니티', 'landing-community': '공개 스크립트', script: '스크립트 본문',
  history: '학습 내역', result: '학습 결과', editor: '스크립트 편집',
  flashcard: '플래시카드', dictation: '받아쓰기', masking: '마스킹 학습',
}

function Content({ view, compact }: { view: string; compact: boolean }) {
  if (['flashcard', 'dictation', 'masking'].includes(view)) return <Study view={view} />
  if (view === 'profile-fields') return <Fields count={3} />
  if (view === 'support' || view === 'admin-support') return <MemberList />
  if (view === 'support-detail') return <div className="skeleton-panel sk-body"><Block shape="title" /><Fields count={3} /><Block shape="textarea" /></div>
  if (view === 'member-list') return <MemberList />
  if (view === 'analytics-table') return <Table />
  if (view === 'landing-community') return <Rows count={3} />
  if (view === 'community') return <>{!compact && <Toolbar />}<Community /></>
  if (view === 'publisher') return <><div className="skeleton-panel sk-profile-identity"><Block shape="avatar" /><div><Block shape="title" /><Block shape="description" /></div><Block shape="button" /></div><Community /></>
  if (view === 'profile') return <><div className="skeleton-panel sk-profile-identity"><Block shape="avatar" /><div><Block shape="title" /><Block shape="description" /></div></div><div className="skeleton-panel sk-body"><Block shape="title" /><Fields count={3} /></div><Stats /></>
  if (view === 'admin-member') return <div className="skeleton-panel sk-body"><Block shape="title" /><Fields count={9} /><Stats /></div>
  if (view === 'admin') return <LearningCards />
  if (view === 'admin-members') return <><Toolbar /><MemberList /></>
  if (view === 'admin-analytics') return <><div className="sk-service-links"><Block shape="button" /><Block shape="button" /><Block shape="button" /></div><Stats count={6} /><div className="sk-analytics-grid">{repeat(2, () => <div className="skeleton-panel sk-body"><Block shape="title" /><Table /></div>)}</div></>
  if (view === 'auth') return <div className="skeleton-panel sk-auth"><Block shape="avatar" /><Block shape="title" /><Block shape="description" /><Block shape="input" /><div className="sk-fields">{repeat(2, () => <><Block shape="label" /><Block shape="input" /></>)}</div><Block shape="input" /></div>
  if (view === 'editor') return <div className="skeleton-panel sk-body"><Block shape="label" /><Block shape="input" /><div className="sk-service-links"><Block shape="button" /><Block shape="button" /></div><Block shape="textarea" /></div>
  if (view === 'result') return <><div className="skeleton-panel sk-result"><Block shape="score" /><Block shape="title" /><Block shape="description" /></div><Stats /><Rows count={3} /></>
  if (view === 'history') return <><Stats /><Toolbar /><Rows count={4} /></>
  if (view === 'script') return <><div className="sk-service-links"><Block shape="button" /><Block shape="button" /></div><div className="skeleton-panel sk-body">{repeat(5, () => <div className="sk-body-row"><Block shape="number" /><div><Block shape="description" /><Block shape="sentence" /></div></div>)}</div></>
  if (view === 'continue') return <LearningCards />
  if (view === 'home') return <><LearningCards /><div className="sk-section-heading"><Block shape="title" /></div><Rows count={3} /></>
  if (view === 'about') return <div className="sk-landing-hero"><Block shape="avatar" /><Block shape="title" /><Block shape="description" /><Block shape="button" /></div>
  return <><Toolbar /><Rows /></>
}

export function LoadingSkeleton({ view = 'home', compact = false }: { view?: string; compact?: boolean }) {
  const label = labels[view] || '화면'
  const fragment = ['profile-fields', 'member-list', 'analytics-table', 'landing-community'].includes(view)
  return <section className={`skeleton-page skeleton-${view}`} role="status" aria-label={`${label} 불러오는 중`} aria-busy="true">
    <span className="sr-only">{label} 불러오는 중</span>
    <div aria-hidden="true">{!compact && !fragment && view !== 'auth' && <Heading />}<Content view={view} compact={compact} /></div>
  </section>
}

export function SkeletonValue() {
  return <span className="skeleton-block sk-value" role="status" aria-label="통계 불러오는 중" aria-busy="true" />
}
