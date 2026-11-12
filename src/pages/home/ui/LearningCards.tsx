import type { ActiveQuizRecord } from '../../../entities/learning'
import { formatDateTime, studyModeLabel } from '../../../shared/lib'
import { Icon } from '../../../shared/ui'
import { dashboardData, learningLabels, savedPosition } from '../lib/dashboard'

type Props = { entries: ReturnType<typeof dashboardData>['recent']; onOpen: (id: string) => void; onResume: (learning: ActiveQuizRecord) => void }
export function LearningCards({ entries, onOpen, onResume }: Props) {
  return <div className="dashboard-recent compact-learning-cards">{entries.map(entry => <article className="dashboard-script" key={entry.script.id}>
    <button className="dashboard-script-title" onClick={() => onOpen(entry.script.id)}><span><strong>{entry.script.title}</strong><small>마지막 학습 {formatDateTime(entry.active[0].updatedAt)}</small></span><Icon name="chevron" /></button>
    <ul className="dashboard-mode-list">{entry.active.map(learning => {
      const { total, position, percent } = savedPosition(learning)
      return <li key={learning.id}><div className="compact-learning-heading"><strong>{learningLabels[learning.quizType]}</strong></div><small>{studyModeLabel(learning.mode)} · {formatDateTime(learning.updatedAt)}</small><div className="compact-learning-progress"><span>{position} / {total} · {percent}%</span>{total > 0 && <meter min={0} max={total} value={position} aria-label={`${learningLabels[learning.quizType]} 저장 위치`} />}</div><button className="primary-btn compact-resume-button" onClick={() => onResume(learning)} aria-label={`${entry.script.title} ${learningLabels[learning.quizType]} 이어서 학습하기`}><Icon name="play" /><span>이어하기</span></button></li>
    })}</ul>
  </article>)}</div>
}
