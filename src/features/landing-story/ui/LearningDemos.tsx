import { useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { normalizeAnswer, sentenceTokens } from '../../../entities/script'
import { Icon, IconButton, Progress } from '../../../shared/ui'
import { useDemoPlayer } from '../lib/useDemoPlayer'
import { demoSentences, dictationPhase, maskingTokens } from '../model/story'

type Player = Omit<ReturnType<typeof useDemoPlayer>, 'ref'>
function DemoShell({ elementRef, player, title, index = 0, total = 1, progress = index, children }: { elementRef: RefObject<HTMLDivElement | null>; player: Player; title: string; index?: number; total?: number; progress?: number; children: ReactNode }) {
  return <div ref={elementRef} className="landing-demo" aria-label={`${title} 시연`}>
    <div className="demo-study-header"><strong>{title}</strong><span>{index + 1} / {total}</span></div>
    <Progress value={progress} total={total} />
    {children}
    <div className="demo-playback"><span>직접 눌러 체험할 수 있어요.</span>{!player.reduced && <button className="text-btn" onClick={player.toggle} aria-pressed={player.paused || player.manual}>{player.completed ? '시연 다시 보기' : player.paused || player.manual ? '시연 계속 보기' : '시연 일시정지'}</button>}</div>
  </div>
}

export function FlashcardDemo() {
  const { ref, ...player } = useDemoPlayer(13600)
  const [manualCard, setManualCard] = useState({ index: 0, flipped: false })
  const [notice, setNotice] = useState('')
  const autoIndex = Math.min(demoSentences.length - 1, Math.floor(player.elapsed / 6800))
  const index = player.manual ? manualCard.index : autoIndex
  const flipped = player.manual ? manualCard.flipped : player.completed || (player.elapsed % 6800 >= 2000 && player.elapsed % 6800 < 6000)
  const sentence = demoSentences[index]
  const move = (direction: number) => {
    player.interact()
    setManualCard({ index: (index + direction + demoSentences.length) % demoSentences.length, flipped: false })
  }
  return <DemoShell elementRef={ref} player={player} title="플래시카드" index={index} total={demoSentences.length}>
    <div className="demo-card-navigation"><IconButton icon="back" label="시연 이전 카드" onClick={() => move(-1)} /><IconButton icon="arrow" label="시연 다음 카드" onClick={() => move(1)} /></div>
    <div className="demo-flip-scene" key={index}>
      <button className={`demo-flip-card ${flipped ? 'is-flipped' : ''}`} aria-label={flipped ? '영어 원문 가리기' : '영어 원문 공개'} aria-pressed={flipped} onClick={() => { player.interact(); setManualCard({ index, flipped: !flipped }); setNotice('') }}>
        <span className="demo-flip-inner">
          <span className="demo-flip-face demo-flip-front" aria-hidden={flipped}><span className="flash-label">SENTENCE {String(index + 1).padStart(2, '0')}</span><strong>{sentence.meaning}</strong><span className="reveal-hint"><Icon name="eye" />눌러서 영어 문장 확인</span></span>
          <span className="demo-flip-face demo-flip-back" aria-hidden={!flipped}><span>{sentence.meaning}</span><strong className="flash-answer">{sentence.english}</strong><span className="reveal-hint">얼마나 잘 기억하고 있었나요?</span></span>
        </span>
      </button>
    </div>
    <div className="study-actions demo-evaluation"><button className="review-btn" disabled={!flipped} onClick={() => { move(1); setNotice('다시 연습으로 평가했어요. 다음 문장으로 이동했어요.') }}><Icon name="reset" />다시 연습</button><button className="success-btn" disabled={!flipped} onClick={() => { move(1); setNotice('기억했어요로 평가했어요. 다음 문장으로 이동했어요.') }}><Icon name="check" />기억했어요</button></div>
    <p className="demo-feedback" role="status">{notice}</p>
  </DemoShell>
}

export function DictationDemo() {
  const { ref, ...player } = useDemoPlayer(8500)
  const phase = dictationPhase(player.elapsed)
  const [manualAnswers, setManualAnswers] = useState(['', ''])
  const [manualGraded, setManualGraded] = useState(false)
  const answers = player.manual ? manualAnswers : [phase.answer, phase.secondAnswer]
  const graded = player.manual ? manualGraded : phase.graded
  const expected = ['painting', 'VR']
  const correct = answers.map((answer, index) => normalizeAnswer(answer) === normalizeAnswer(expected[index]))
  const beginInteraction = () => { if (!player.manual) { setManualAnswers(answers); setManualGraded(graded) } player.interact() }
  const changeAnswer = (index: number, value: string) => {
    beginInteraction()
    setManualAnswers(answers.map((answer, i) => i === index ? value : answer))
    setManualGraded(false)
  }
  return <DemoShell elementRef={ref} player={player} title="받아쓰기" progress={graded ? 1 : 0}>
    <form className="question-card demo-question" onSubmit={event => { event.preventDefault(); beginInteraction(); setManualAnswers(answers); setManualGraded(true) }}>
      <div className="question-label-row"><p className="eyebrow">SENTENCE 01</p><span>{graded ? '채점 완료' : '빈칸을 채워 보세요'}</span></div>
      <div className="question-top"><p>{demoSentences[0].meaning}</p></div>
      <div className="sentence-line demo-sentence"><span>We can do face</span>{expected.map((answer, index) => <span className="blank-wrap" key={answer}>
        {index === 1 && <span>or play </span>}<input aria-label={`시연 ${index === 0 ? '첫' : '두'} 번째 빈칸`} value={answers[index]} maxLength={24} readOnly={graded} className={graded ? correct[index] ? 'correct' : 'wrong' : ''} autoCapitalize="none" autoCorrect="off" spellCheck={false} onFocus={beginInteraction} onChange={event => changeAnswer(index, event.target.value)} style={{ width: index === 0 ? '128px' : '64px' }} />
        {graded && !correct[index] && <button type="button" className="answer-correction" aria-label={`${answer}: 정답으로 변경`} onClick={() => { beginInteraction(); setManualAnswers(answers.map((value, i) => i === index ? answer : value)); setManualGraded(true) }}>{answer}</button>}
      </span>)}<span>games.</span></div>
      <div className="button-row"><button className={`primary-btn ${!player.manual && phase.pressed ? 'demo-grade-pressed' : ''}`} type="submit" disabled={graded}><Icon name="check" />{graded ? '채점 완료' : '채점하기'}</button><IconButton type="button" icon="reset" label="시연 입력 초기화" onClick={() => { player.interact(); setManualAnswers(['', '']); setManualGraded(false) }} />{graded && <span className="demo-grade-result">정답 {correct.filter(Boolean).length} / 2</span>}</div>
    </form>
  </DemoShell>
}

export function MaskingDemo() {
  const { ref, ...player } = useDemoPlayer(6500)
  const tokens = sentenceTokens(demoSentences[0].english)
  const [manualTokens, setManualTokens] = useState<number[]>([])
  const count = Math.min(tokens.length, 3 + maskingTokens(player.elapsed, tokens.length - 3))
  const visible = player.manual ? manualTokens : tokens.flatMap((_, index) => index < count ? [index] : [])
  const setTokens = (next: number[]) => { player.interact(); setManualTokens(next) }
  return <DemoShell elementRef={ref} player={player} title="마스킹 학습">
    <div className="mask-card demo-mask"><p className="eyebrow">SENTENCE 01</p><h3>{demoSentences[0].meaning}</h3><p className="mask-instruction">단어를 누르면 공개되고, 다시 누르면 가려져요.</p>
      <div className="mask-sentence">{tokens.map((token, index) => <button key={index} className={`mask-token ${visible.includes(index) ? 'is-visible' : ''}`} aria-label={`시연 ${index + 1}번째 단어 ${visible.includes(index) ? `${token} 가리기` : '공개'}`} aria-pressed={visible.includes(index)} onClick={() => setTokens(visible.includes(index) ? visible.filter(value => value !== index) : [...visible, index])}><span aria-hidden={!visible.includes(index)}>{token}</span></button>)}</div>
      <div className="button-row"><button onClick={() => setTokens(tokens.map((_, index) => index))}>전체 공개</button><button onClick={() => setTokens([])}>전체 가리기</button></div>
    </div>
  </DemoShell>
}
