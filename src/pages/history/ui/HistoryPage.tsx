import type { DictationSessionRecord, FlashcardSessionRecord } from '../../../entities/learning'
import type { ScriptRecord } from '../../../entities/script'
import { dictationModeLabel, formatDateTime, formatPercent } from '../../../shared/lib'
import { Icon } from '../../../shared/ui'

type HistoryPageProps = {
  script: ScriptRecord
  dictationSessions: DictationSessionRecord[]
  flashcardSessions: FlashcardSessionRecord[]
  onBack: () => void
  onNewStudy: () => void
  onOpenDictation: (session: DictationSessionRecord) => void
}

export function HistoryPage({ script, dictationSessions, flashcardSessions, onBack, onNewStudy, onOpenDictation }: HistoryPageProps) {
  return (
    <section className="history-page">
      <button className="text-btn back-link" onClick={onBack}><Icon name="back" />{script.title}</button>
      <div className="page-top"><div><p className="eyebrow">Learning history</p><h1>학습 내역</h1><p className="page-description">차곡차곡 쌓인 나의 학습 기록</p></div><button className="primary-btn" onClick={onNewStudy}><Icon name="play" />새 학습</button></div>
      <section className="body-panel quiz-history-panel">
        <div className="panel-top"><div><p className="eyebrow">Learning History</p><h2>학습 내역</h2></div><span className="panel-count">{dictationSessions.length + flashcardSessions.length}개</span></div>
        {!!dictationSessions.length && (
          <div className="quiz-history-list">
            {dictationSessions.map((session) => {
              const accuracy = session.totalQuestions > 0 ? (session.correctQuestions / session.totalQuestions) * 100 : 0
              return (
                <button className="quiz-history-row" key={session.id} onClick={() => onOpenDictation(session)}>
                  <span className="quiz-history-main"><strong>{formatDateTime(session.createdAt)}</strong><small>{dictationModeLabel(session.mode)} · 정답률 {formatPercent(accuracy)}</small></span>
                  <span className="quiz-history-stats"><em>{session.correctQuestions}/{session.totalQuestions}</em><small>오답 {session.wrongQuestions} · 단어 {session.wrongWords.length}</small></span>
                  <Icon name="chevron" className="row-arrow" />
                </button>
              )
            })}
          </div>
        )}
        {!dictationSessions.length && !flashcardSessions.length && <div className="empty-state slim"><h2>아직 학습 기록이 없습니다.</h2><p>플래시카드나 받아쓰기를 완료하면 이곳에 결과가 쌓입니다.</p></div>}
        {!!flashcardSessions.length && (
          <div className="quiz-history-list flashcard-history-list">
            {flashcardSessions.map((session) => (
              <article className="quiz-history-row" key={session.id}>
                <span className="quiz-history-main"><strong>{formatDateTime(session.createdAt)}</strong><small>플래시카드 · {session.totalCards}문장 학습</small></span>
                <span className="quiz-history-stats"><em>{session.totalCards - session.unknownCards}/{session.totalCards}</em><small>기억함 · 다시 연습 {session.unknownCards}</small></span>
                <Icon name="cards" className="row-arrow" />
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
