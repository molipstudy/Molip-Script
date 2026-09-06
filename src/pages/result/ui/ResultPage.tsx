import type { DictationGrade, DictationQuestion, DictationSessionRecord } from '../../../entities/learning'
import type { QuizItem, ScriptRecord, SentenceStat } from '../../../entities/script'
import { questionSentence } from '../../../features/dictation'
import { dictationModeLabel, formatDateTime, formatPercent } from '../../../shared/lib'
import { IconButton } from '../../../shared/ui'

type ResultPageProps = {
  script: ScriptRecord
  session: DictationSessionRecord | null
  questions: DictationQuestion[]
  grades: Record<number, DictationGrade>
  stats: Record<string, SentenceStat>
  showDetails: boolean
  onBack: () => void
  onRetryWrong: (indexes: number[]) => void
  onDelete: (session: DictationSessionRecord) => Promise<unknown>
  onToggleStar: (item: QuizItem, index: number) => Promise<unknown>
}

export function ResultPage({ script, session, questions, grades, stats, showDetails, onBack, onRetryWrong, onDelete, onToggleStar }: ResultPageProps) {
  if (!session) {
    return <section className="result-page"><div className="empty-state"><h2>퀴즈 결과를 찾을 수 없습니다.</h2><p>삭제되었거나 아직 저장된 받아쓰기 기록이 없습니다.</p><button className="primary-btn" onClick={onBack}>스크립트로 돌아가기</button></div></section>
  }

  const accuracy = session.totalQuestions > 0 ? (session.correctQuestions / session.totalQuestions) * 100 : 0
  const wrongIndexes = showDetails && questions.length === session.totalQuestions
    ? questions.map((_, index) => index).filter((index) => grades[index] && grades[index].correct < grades[index].total)
    : []

  return (
    <section className="result-page">
      <section className="result-hero">
        <div><button className="text-btn" onClick={onBack}>스크립트로</button><p className="eyebrow">Quiz Result</p><h1>받아쓰기 결과</h1><p>{script.title} · {dictationModeLabel(session.mode)} · {formatDateTime(session.createdAt)}</p></div>
        <div className="score-ring" aria-label={`정답률 ${formatPercent(accuracy)}`}><span>{formatPercent(accuracy)}</span><small>정답률</small></div>
      </section>

      <section className="result-widgets" aria-label="퀴즈 요약">
        <article className="result-widget score"><span>점수</span><strong>{session.correctQuestions}/{session.totalQuestions}</strong><small>맞힌 문장</small></article>
        <article className="result-widget"><span>틀린 문장</span><strong>{session.wrongQuestions}</strong><small>다시 확인할 문장</small></article>
        <article className="result-widget"><span>틀린 단어</span><strong>{session.wrongWords.length}</strong><small>기록된 취약 단어</small></article>
      </section>

      <section className="body-panel result-progress-panel">
        <div className="panel-top"><h2>학습 요약</h2><strong>{formatPercent(accuracy)}</strong></div>
        <div className="result-meter" aria-hidden="true"><span style={{ width: `${accuracy}%` }} /></div>
        <p>총 {session.totalQuestions}문장 중 {session.correctQuestions}문장을 맞혔고, {session.wrongQuestions}문장은 다시 연습이 필요합니다.</p>
      </section>

      <section className="body-panel">
        <div className="panel-top"><h2>틀린 단어</h2><span className="panel-count">{session.wrongWords.length}개</span></div>
        {session.wrongWords.length ? <div className="wrong-word-cloud">{session.wrongWords.map((word) => <span key={word}>{word}</span>)}</div> : <p className="muted">기록된 틀린 단어가 없습니다.</p>}
      </section>

      {!!wrongIndexes.length && (
        <section className="body-panel">
          <div className="panel-top"><h2>틀린 문장</h2><span className="panel-count">{wrongIndexes.length}개</span></div>
          <div className="wrong-list polished">
            {wrongIndexes.map((index) => {
              const question = questions[index]
              const grade = grades[index]
              const starred = stats[question.sentenceKey]?.starred
              return <article key={question.sentenceKey}><IconButton className={`star-button ${starred ? 'active' : ''}`} icon="star" label={starred ? '별표 해제' : '별표 표시'} aria-pressed={Boolean(starred)} onClick={() => void onToggleStar(question.item, question.sourceIndex)} /><strong>{question.item.number}. {question.item.meaning}</strong><p>{questionSentence(question)}</p><small>틀린 단어: {grade.wrongWords.join(', ')}</small></article>
            })}
          </div>
        </section>
      )}

      <div className="result-actions">
        <button className="primary-btn" onClick={() => onRetryWrong(wrongIndexes)} disabled={!wrongIndexes.length}>{wrongIndexes.length ? '틀린 문제 다시 풀기' : '틀린 문제 없음'}</button>
        <button onClick={onBack}>스크립트 보기</button>
        <button className="danger-btn" onClick={() => void onDelete(session)}>결과 삭제</button>
      </div>
    </section>
  )
}
