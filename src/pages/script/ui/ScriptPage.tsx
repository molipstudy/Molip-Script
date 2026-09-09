import type { ActiveDictationState, ActiveFlashcardState, ActiveQuizRecord } from '../../../entities/learning'
import type { QuizItem, ScriptRecord, SentenceStat, WordStat } from '../../../entities/script'
import { sentenceKeyOf } from '../../../entities/script'
import { HighlightedSentence } from '../../../entities/script'
import { formatDateTime, studyModeLabel } from '../../../shared/lib'
import { AsyncButton, Icon, IconButton, StudyTip } from '../../../shared/ui'

type ScriptPageProps = {
  script: ScriptRecord
  items: QuizItem[]
  stats: Record<string, SentenceStat>
  wordStats: WordStat[]
  historyCount: number
  activeLearnings: ActiveQuizRecord[]
  showMeaning: boolean
  onBack: () => void
  onEdit: () => void
  onOpenHistory: () => void
  onOpenStudy: () => void
  onShowMeaningChange: (show: boolean) => void
  onResume: (learning: ActiveQuizRecord) => void
  onDeleteActive: (quizType: 'dictation' | 'flashcard') => Promise<unknown>
  onToggleStar: (item: QuizItem, index: number) => Promise<unknown>
}

export function ScriptPage({
  script, items, stats, wordStats, historyCount, activeLearnings, showMeaning,
  onBack, onEdit, onOpenHistory, onOpenStudy, onShowMeaningChange, onResume,
  onDeleteActive, onToggleStar,
}: ScriptPageProps) {
  const weakWords = new Set(wordStats.filter((stat) => stat.wrongCount > 0).map((stat) => stat.word))
  return (
    <section className="script-detail-page">
      <div className="script-hero">
        <div><button className="text-btn mobile-relocated" onClick={onBack}><Icon name="back" />내 스크립트</button><h1 className="mobile-relocated">{script.title}</h1><p>문장 {items.length}개 · 최근 열람 {formatDateTime(script.lastOpenedAt)}</p></div>
        <div className="script-actions">
          <IconButton className="mobile-relocated" icon="edit" label="스크립트 수정" onClick={onEdit} />
          <button onClick={onOpenHistory}><Icon name="history" />학습 내역 <span className="count-badge">{historyCount}</span></button>
          <button className="primary-btn jumbo-btn" onClick={onOpenStudy}><Icon name="play" />학습하기</button>
        </div>
      </div>

      {!!activeLearnings.length && (
        <section className="active-learning-panel">
          <div className="panel-top"><div><p className="eyebrow">Continue</p><h2>학습 이어하기</h2></div><span className="panel-count">{activeLearnings.length}개</span></div>
          <div className="active-learning-list">
            {activeLearnings.map((learning) => {
              const isDictation = learning.quizType === 'dictation'
              const total = isDictation
                ? (learning.state as ActiveDictationState).questions.length
                : (learning.state as ActiveFlashcardState).queue.length
              return (
                <article className="resume-banner" key={learning.quizType}>
                  <span className="learning-type-icon"><Icon name={isDictation ? 'pen' : 'cards'} /></span>
                  <div className="learning-summary"><strong>{isDictation ? '받아쓰기' : '플래시카드'}</strong><span>{studyModeLabel(learning.mode)} · {Math.min(learning.progress, total)} / {total} · {formatDateTime(learning.updatedAt)} 저장</span></div>
                  <div className="button-row">
                    <button className="primary-btn" onClick={() => onResume(learning)}><Icon name="play" />이어하기</button>
                    <AsyncButton className="icon-btn" aria-label={`${isDictation ? '받아쓰기' : '플래시카드'} 기록 삭제`} title="진행 중인 학습 삭제" onAction={() => onDeleteActive(learning.quizType)}><Icon name="trash" /></AsyncButton>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      <StudyTip context="script" />
      <section className="body-panel">
        <div className="panel-top"><h2><Icon name="book" />스크립트 본문 <span className="count-badge">{items.length}</span></h2><button className={`reading-toggle ${showMeaning ? 'active' : ''}`} aria-pressed={showMeaning} onClick={() => onShowMeaningChange(!showMeaning)}><Icon name="eye" />해석</button></div>
        <div className="script-body">
          {items.map((item, index) => {
            const stat = stats[sentenceKeyOf(item, index)]
            const isWeak = Boolean(stat) && (stat.dictationWrongCount > 0 || stat.flashcardUnknownCount > 0)
            return (
              <article className={`${isWeak ? 'weak-sentence' : ''} ${stat?.starred ? 'starred-sentence' : ''}`} key={`${item.number}-${item.english}`}>
                <IconButton className={`star-button ${stat?.starred ? 'active' : ''}`} icon="star" label={stat?.starred ? '별표 해제' : '별표 표시'} aria-pressed={Boolean(stat?.starred)} onClick={() => void onToggleStar(item, index)} />
                <span className="sentence-number">{String(index + 1).padStart(2, '0')}</span>
                {showMeaning && <p>{item.meaning}{isWeak && <span className="weak-badge">취약</span>}</p>}
                <strong><HighlightedSentence english={item.english} weakWords={weakWords} /></strong>
              </article>
            )
          })}
        </div>
      </section>
    </section>
  )
}
