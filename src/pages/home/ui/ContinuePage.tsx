import type { ActiveQuizRecord, LearningStore } from '../../../entities/learning'
import { Icon } from '../../../shared/ui'
import { dashboardData } from '../lib/dashboard'
import { LearningCards } from './LearningCards'

type Props = { store: LearningStore; onOpen: (id: string) => void; onResume: (learning: ActiveQuizRecord) => void; onBack: () => void; onLibrary: () => void }
export function ContinuePage({ store, onOpen, onResume, onBack, onLibrary }: Props) {
  const { recent } = dashboardData(store)
  return <section className="dashboard"><button className="text-btn" onClick={onBack}><Icon name="back" />홈으로</button><header className="page-top"><div><p className="eyebrow">Continue learning</p><h1>학습 이어하기</h1><p className="page-description">진행 중인 학습을 최근 저장 순으로 확인하세요.</p></div></header>{recent.length ? <LearningCards entries={recent} onOpen={onOpen} onResume={onResume} /> : <section className="empty-state"><h2>진행 중인 학습이 없어요.</h2><button onClick={onLibrary}>내 스크립트에서 학습 시작</button></section>}</section>
}
