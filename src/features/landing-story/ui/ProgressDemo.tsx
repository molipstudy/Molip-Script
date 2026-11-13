import { useState } from 'react'
import { Icon } from '../../../shared/ui'
import { demoSentences } from '../model/story'

const sampleRecords = [
  { mode: '플래시카드', position: 8, total: 16 },
  { mode: '받아쓰기', position: 6, total: 16 },
  { mode: '마스킹 학습', position: 4, total: 16 },
] as const

// Presentation-only fixtures. No app store, network, authentication or storage access.
export function ProgressDemo() {
  const [continued, setContinued] = useState<number | null>(null)
  const [review, setReview] = useState<number | null>(null)
  return <div className="progress-demo" aria-label="학습 기록 시연">
    <header className="progress-demo-heading"><div><h3>교과서 본문 1과</h3><p>모드별로 저장된 위치에서 이어갈 수 있어요.</p></div></header>
    <ul className="progress-demo-modes">{sampleRecords.map((record, index) => <li key={record.mode}>
      <div className="progress-demo-mode"><strong>{record.mode}</strong><div className="progress-demo-meter"><span>{record.position} / {record.total}</span><meter value={record.position} min={0} max={record.total} aria-label={`${record.mode} 예시 진행률`} /><small>{Math.round(record.position / record.total * 100)}%</small></div></div>
      <button className="progress-demo-resume" aria-pressed={continued === index} aria-label={`${record.mode} 이어하기 시연`} onClick={() => { setContinued(continued === index ? null : index); setReview(null) }}><Icon name="play" /><span>이어하기</span></button>
    </li>)}</ul>
    <section className="progress-demo-review" aria-labelledby="demo-review-title"><div><h4 id="demo-review-title">취약 문장 복습</h4><span>2문장</span></div>{demoSentences.map((sentence, index) => <button key={sentence.english} aria-pressed={review === index} onClick={() => { setReview(review === index ? null : index); setContinued(null) }}><span>{sentence.meaning}{review === index && <em>{sentence.english}</em>}</span><Icon name={review === index ? 'collapse' : 'arrow'} /></button>)}</section>
  </div>
}
