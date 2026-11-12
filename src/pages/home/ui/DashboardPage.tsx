import { LearningCards } from './LearningCards'
import type { ActiveQuizRecord, LearningStore } from '../../../entities/learning'
import { Icon } from '../../../shared/ui'
import { dashboardData } from '../lib/dashboard'

type Props = {
  onMore: () => void
  store: LearningStore
  onOpen: (id: string) => void
  onResume: (learning: ActiveQuizRecord) => void
  onCreate: () => void
  onLibrary: () => void
  onCommunity: () => void
  onReview: (id: string) => void
}

export function DashboardPage({ onMore, store, onOpen, onResume, onCreate, onLibrary, onCommunity, onReview }: Props) {
  const { recent, review } = dashboardData(store)
  return <section className="dashboard">
    <header className="page-top dashboard-heading"><div><p className="eyebrow">Your study space</p><h1>오늘도 영어 한 문장부터.</h1><p className="page-description">{recent.length ? '지난번의 몰입을 이어가 보세요.' : '나만의 문장으로, 나만의 속도로 시작하세요.'}</p></div></header>
    {!store.scripts.length ? <section className="dashboard-welcome"><p className="eyebrow">Start your first script</p><h2>첫 번째 스크립트를 만나볼까요?</h2><p>암기할 영어 본문을 추가하거나, 커뮤니티의 공개 스크립트를 내 스크립트에 담아 학습하세요.</p><div className="button-row"><button className="primary-btn" onClick={onCreate}><Icon name="plus" />첫 스크립트 만들기</button><button onClick={onCommunity}><Icon name="users" />커뮤니티에서 찾아보기</button></div></section> : recent.length > 0 ? <section aria-labelledby="recent-study-heading"><div className="panel-top"><div><p className="eyebrow">{recent.length ? 'Continue learning' : 'Ready to learn'}</p><h2 id="recent-study-heading">{recent.length ? '최근 학습' : '학습을 시작해 보세요'}</h2></div><button className="text-btn" onClick={onMore}>더 보기 <Icon name="arrow" /></button></div>{!recent.length && <p className="page-description">아직 학습 기록이 없어요. 준비한 스크립트에서 학습 방법을 선택하세요.</p>}
      <LearningCards entries={recent.slice(0, 3)} onOpen={onOpen} onResume={onResume} />

    </section> : null}
    <nav className="dashboard-shortcuts" aria-label="학습 바로가기"><button onClick={onCreate}><Icon name="plus" /><span>새 스크립트 만들기</span><Icon name="chevron" /></button><button onClick={onLibrary}><Icon name="book" /><span>내 스크립트로 이동</span><Icon name="chevron" /></button><button onClick={onCommunity}><Icon name="users" /><span>커뮤니티 둘러보기</span><Icon name="chevron" /></button></nav>
    {review.length > 0 && <section className="dashboard-review" aria-labelledby="dashboard-review-heading"><div className="panel-top"><h2 id="dashboard-review-heading">복습이 필요한 문장</h2>{review.length > 0 && <span className="count-badge">{review.reduce((total, entry) => total + entry.weakCount, 0)}문장</span>}</div>{review.length ? <div className="dashboard-review-list">{review.slice(0, 3).map(entry => <button key={entry.script.id} onClick={() => onReview(entry.script.id)}><span><strong>{entry.script.title}</strong><small>취약 문장 {entry.weakCount}개 · 복습 범위 선택</small></span><Icon name="arrow" /></button>)}{review.length > 3 && <button className="text-btn" onClick={onLibrary}>내 스크립트에서 더 보기</button>}</div> : <p className="page-description">아직 기록된 취약 문장이 없어요. 학습 중 어려웠던 문장이 생기면 여기서 복습할 수 있어요.</p>}</section>}
  </section>
}
