import type { BlankUnit, DictationGrade, DictationQuestion } from '../../../entities/learning'
import type { QuizItem, SentenceStat } from '../../../entities/script'
import { questionSentence } from '../../../features/dictation'
import { AsyncButton, Icon, IconButton, Progress, StudyTip } from '../../../shared/ui'

type DictationPageProps = {
  questions: DictationQuestion[]
  index: number
  answers: Record<string, string>
  grades: Record<number, DictationGrade>
  stats: Record<string, SentenceStat>
  solvedCount: number
  correctCount: number
  wrongCount: number
  done: boolean
  onMove: (direction: -1 | 1) => Promise<unknown>
  onRetryWrong: (indexes: number[]) => void
  onExit: () => void
  onToggleStar: (item: QuizItem, index: number) => Promise<unknown>
  onRegisterInput: (blankId: string, node: HTMLInputElement | null) => void
  onAnswerChange: (blankId: string, value: string) => void
  onToggleBlank: (blank: BlankUnit) => Promise<unknown>
  onBlankEnter: (blankId: string) => void
  onPrimary: () => Promise<unknown>
  onReset: () => void
  onSaveExit: () => Promise<unknown>
}

export function DictationPage(props: DictationPageProps) {
  const {
    questions, index, answers, grades, stats, solvedCount, correctCount, wrongCount, done,
    onMove, onRetryWrong, onExit, onToggleStar, onRegisterInput, onAnswerChange,
    onToggleBlank, onBlankEnter, onPrimary, onReset, onSaveExit,
  } = props
  const total = questions.length
  const question = questions[index] ?? null
  const grade = grades[index]
  const blanks = question ? question.units.filter((unit): unit is BlankUnit => unit.kind === 'blank') : []
  const wrongIndexes = questions.map((_, questionIndex) => questionIndex).filter((questionIndex) => grades[questionIndex] && grades[questionIndex].correct < grades[questionIndex].total)

  return (
    <section className="dictation-page">
      <div className="study-header">
        <button onClick={() => void onMove(-1)} disabled={index <= 0 || done}><Icon name="back" /><span className="sr-only">이전 문장</span></button>
        <div><strong className="mobile-relocated">받아쓰기</strong><span>진행 {Math.min(index + 1, total)} / {total} · 정답 {correctCount} · 오답 {wrongCount} · 남은 {Math.max(0, total - solvedCount)}</span></div>
        <button onClick={() => void onMove(1)} disabled={index >= total - 1 || done}><Icon name="arrow" /><span className="sr-only">다음 문장</span></button>
      </div>

      <Progress value={solvedCount} total={total} />
      {!done && <StudyTip key={grade ? 'graded-tip' : 'dictation-tip'} context={grade ? 'graded' : 'dictation'} />}
      {done ? (
        <section className="result-card">
          <h1>받아쓰기 완료</h1>
          <p>정답 {correctCount}개 · 오답 {wrongCount}개 · 기록된 취약 단어 {Array.from(new Set(Object.values(grades).flatMap((item) => item.wrongWords))).length}개</p>
          {!!wrongIndexes.length && (
            <div className="wrong-list">
              {wrongIndexes.map((questionIndex) => {
                const wrongQuestion = questions[questionIndex]
                const wrongGrade = grades[questionIndex]
                const starred = stats[wrongQuestion.sentenceKey]?.starred
                return (
                  <article key={wrongQuestion.sentenceKey}>
                    <IconButton className={`star-button ${starred ? 'active' : ''}`} icon="star" label={starred ? '별표 해제' : '별표 표시'} aria-pressed={Boolean(starred)} onClick={() => void onToggleStar(wrongQuestion.item, wrongQuestion.sourceIndex)} />
                    <strong>{wrongQuestion.item.number}. {wrongQuestion.item.meaning}</strong><p>{questionSentence(wrongQuestion)}</p><small>틀린 단어: {wrongGrade.wrongWords.join(', ')}</small>
                  </article>
                )
              })}
            </div>
          )}
          <div className="button-row"><button className="primary-btn" onClick={() => onRetryWrong(wrongIndexes)} disabled={!wrongIndexes.length}>{wrongIndexes.length ? '틀린 문제 다시 풀기' : '틀린 문제 없음'}</button><button onClick={onExit}>스크립트로</button></div>
        </section>
      ) : question && (
        <section className="question-card" key={index}>
          <div className="question-label-row">
            <p className="eyebrow question-label">SENTENCE {String(question.sourceIndex + 1).padStart(2, '0')}<span>{grade ? '채점 완료' : '빈칸을 채워 보세요'}</span></p>
            <IconButton className={`star-button ${stats[question.sentenceKey]?.starred ? 'active' : ''}`} icon="star" label={stats[question.sentenceKey]?.starred ? '별표 해제' : '별표 표시'} aria-pressed={Boolean(stats[question.sentenceKey]?.starred)} onClick={() => void onToggleStar(question.item, question.sourceIndex)} />
          </div>
          <div className="question-top"><p>{question.item.number}. {question.item.meaning}</p>{grade && <strong>이번 문장 {grade.correct} / {grade.total}</strong>}</div>
          <div className="sentence-line">
            {question.units.map((unit, unitIndex) => {
              if (unit.kind === 'text') return <span key={`${unit.token}-${unitIndex}`}>{unit.token}</span>
              const status = grade ? (grade.checkedById[unit.blankId] ? 'correct' : 'wrong') : ''
              return (
                <span className="blank-wrap" key={unit.blankId}>
                  {unit.prefix}
                  <input
                    ref={(node) => onRegisterInput(unit.blankId, node)} className={status} style={{ width: `${unit.width}px` }} value={answers[unit.blankId] ?? ''}
                    readOnly={Boolean(grade)} autoCapitalize="none" autoCorrect="off" spellCheck={false}
                    title={grade ? '클릭하면 정답/오답을 바꿉니다.' : undefined}
                    aria-label={grade ? `${unit.answer} 정답 오답 전환` : `${unit.answer.length}글자 빈칸`}
                    onChange={(event) => onAnswerChange(unit.blankId, event.target.value)}
                    onClick={() => { if (grade) void onToggleBlank(unit) }}
                    onKeyDown={(event) => {
                      if (grade && event.key === ' ') { event.preventDefault(); void onToggleBlank(unit) }
                      if (event.key === 'Enter') { event.preventDefault(); onBlankEnter(unit.blankId) }
                    }}
                  />
                  {unit.suffix}
                  {grade && !grade.checkedById[unit.blankId] && <button className="answer-correction" title="정답으로 변경" aria-label={`${unit.answer}: 정답으로 변경`} onClick={() => void onToggleBlank(unit)}>{unit.answer}</button>}
                </span>
              )
            })}
          </div>
          <div className="button-row">
            <AsyncButton className="primary-btn" onAction={onPrimary}><Icon name={grade ? 'arrow' : 'check'} />{grade ? (index === total - 1 ? '결과 보기' : '다음 문장') : '채점하기'}</AsyncButton>
            <IconButton icon="reset" label="이 문장 입력 초기화" onClick={onReset} disabled={Boolean(grade) || !blanks.length} />
            <AsyncButton className="exit-study mobile-relocated" onAction={onSaveExit}><Icon name="logout" />저장 후 나가기</AsyncButton>
          </div>
        </section>
      )}
    </section>
  )
}
