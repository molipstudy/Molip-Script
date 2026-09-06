import { useEffect, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

const paths = {
  star: 'm12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9Z',
  profile: 'M20 21v-2a7 7 0 0 0-14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  plus: 'M12 5v14M5 12h14',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  book: 'M4 3h13a3 3 0 0 1 3 3v15H6a3 3 0 0 1-3-3V4a1 1 0 0 1 1-1ZM3 17h17M8 7h7M8 11h5',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  back: 'M19 12H5m5-5-5 5 5 5',
  chevron: 'm9 5 7 7-7 7',
  edit: 'm16 3 5 5-12 12-6 1 1-6ZM14 5l5 5',
  history: 'M3 11a9 9 0 1 1 2.5 7M3 4v7h7M12 7v5l3 2',
  play: 'm8 4 12 8-12 8Z',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  reset: 'M3 11a9 9 0 1 1 2.5 7M3 4v7h7',
  logout: 'M9 21H4V3h5M9 12h12m-5-5 5 5-5 5',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  bulb: 'M9 18h6M9 21h6M8 14a7 7 0 1 1 8 0l-1 2H9Z',
  cards: 'm7 3 14 3-3 15-14-3ZM3 3 1 17',
  pen: 'm16 3 5 5-12 12-6 1 1-6ZM14 5l5 5',
  copy: 'M9 9h12v12H9ZM5 15H3V3h12v2',
  share: 'M12 16V3m-5 5 5-5 5 5M4 13v8h16v-8',
  settings: 'M4 7h16M4 17h16M8 4v6M16 14v6',
  eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2',
  github: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7.5A5.8 5.8 0 0 0 19.3 3 5.4 5.4 0 0 0 19.2 0S18 0 15 1.5a13.4 13.4 0 0 0-7 0C5 0 3.8 0 3.8 0A5.4 5.4 0 0 0 3.7 3 5.8 5.8 0 0 0 2.2 7c0 5.9 3.5 7.1 6.8 7.5A4.8 4.8 0 0 0 8 18v4M8 19c-3 .9-3-1.5-4-2',
} as const
export type IconName = keyof typeof paths
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
export function IconButton({ icon, label, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return <button {...props} className={`icon-btn ${className}`} aria-label={label} title={label}><Icon name={icon} /></button>
}
export function AsyncButton({ onAction, children, disabled, ...props }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & { onAction: () => Promise<unknown>; children: ReactNode }) {
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const run = async () => {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    try { await onAction() } finally { locked.current = false; setBusy(false) }
  }
  return <button {...props} disabled={disabled || busy} aria-busy={busy} onClick={() => void run()}>{busy && <span className="spinner" aria-hidden="true" />}{children}</button>
}
export function Progress({ value, total }: { value: number; total: number }) {
  return <div className="study-progress" role="progressbar" aria-label="학습 진행률" aria-valuemin={0} aria-valuemax={Math.max(total, 1)} aria-valuenow={Math.min(value, total)}><span style={{ width: `${total ? Math.min(100, value / total * 100) : 0}%` }} /></div>
}
const tips = {
  script: ['밑줄이 표시된 단어는 이전 학습에서 어려웠던 단어예요. 학습 설정에서 취약 문장만 골라 복습할 수 있어요.', '퀴즈 내역에서 지난 점수를 확인하고, 틀린 문제를 다시 풀어 보세요.'],
  flashcard: ['← 다시 연습 · → 기억했어요 · ↑ 이전 · ↓ 다음 단축키를 바로 사용할 수 있어요.', 'Space를 눌러 영어 문장을 확인하세요.', '단어 선택에서는 ← / →로 이동하고 Enter로 기록, Esc로 넘길 수 있어요.', '‘다시 연습’을 선택하면 어려운 문장과 단어를 다음 학습에 활용할 수 있어요.'],
  dictation: ['← 이전 단어 · → 다음 단어 · ↑ 이전 문장 · ↓ 다음 문장으로 이동해요. 입력한 답은 그대로 유지돼요.', 'Enter를 누르면 다음 빈칸으로 이동하고, 마지막 빈칸에서는 채점해요.', '채점한 빈칸을 누르면 정답과 오답을 직접 바꿀 수 있어요. 키보드에서는 Space를 누르세요.'],
  graded: ['채점한 빈칸을 누르면 정답 ↔ 오답을 바꿀 수 있어요. 변경한 결과는 학습 기록에도 반영돼요.', '← 이전 단어 · → 다음 단어 · ↑ 이전 문장 · ↓ 다음 문장으로 이동할 수 있어요.'],
  community: ['마음에 드는 스크립트를 내 서재에 담으면 플래시카드와 받아쓰기로 학습할 수 있어요.'],
} as const
const dismissedTips = new Set<string>()
export function StudyTip({ context }: { context: keyof typeof tips }) {
  const [index, setIndex] = useState(0)
  const [hidden, setHidden] = useState(() => dismissedTips.has(context))
  if (hidden) return <button className="tip-reopen" onClick={() => { dismissedTips.delete(context); setHidden(false) }}><Icon name="bulb" />학습 Tip</button>
  const choices = tips[context]
  return <aside className="study-tip"><Icon name="bulb" /><p><strong>Tip</strong>{choices[index % choices.length]}</p>{choices.length > 1 && <IconButton icon="chevron" label="다음 도움말" onClick={() => setIndex(index + 1)} />}<IconButton icon="close" label="도움말 숨기기" onClick={() => { dismissedTips.add(context); setHidden(true) }} /></aside>
}

export function Modal({ label, onClose, children }: { label: string; onClose?: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const root = ref.current
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = () => Array.from(root?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea, [href], [tabindex="0"]') ?? [])
    focusable()[0]?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && close.current) { event.preventDefault(); close.current() }
      if (event.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (!first) { event.preventDefault(); root?.focus(); return }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    root?.addEventListener('keydown', handleKey)
    return () => { root?.removeEventListener('keydown', handleKey); document.body.style.overflow = oldOverflow; previous?.focus() }
  }, [])
  return <div ref={ref} tabIndex={-1} className="modal-backdrop" role="dialog" aria-modal="true" aria-label={label} onClick={(event) => { if (event.target === event.currentTarget) onClose?.() }}>{children}</div>
}

export function LoadingSkeleton({ view = 'home', compact = false }: { view?: string; compact?: boolean }) {
  const study = view === 'flashcard' || view === 'dictation'
  const detail = ['script', 'history', 'result'].includes(view)
  return <section className={`skeleton-page skeleton-${view}`} role="status" aria-label="화면을 불러오는 중" aria-busy="true">
    <span className="sr-only">학습 공간을 준비하고 있어요.</span>
    <div aria-hidden="true">
      {!compact && <div className="skeleton-heading"><div><span className="skeleton-block sk-eyebrow" /><span className="skeleton-block sk-title" /><span className="skeleton-block sk-description" /></div><span className="skeleton-block sk-button" /></div>}
      {study ? <><div className="skeleton-block sk-progress" /><div className="skeleton-panel sk-study"><span className="skeleton-block sk-eyebrow" /><span className="skeleton-block sk-sentence" /><span className="skeleton-block sk-sentence short" />{view === 'dictation' && <div className="sk-blanks">{[0,1,2].map(i => <span className="skeleton-block" key={i} />)}</div>}</div><div className="sk-study-actions"><span className="skeleton-block sk-button" /><span className="skeleton-block sk-button" /></div></> : detail ? <div className="skeleton-panel sk-body">{Array.from({length:5}, (_, i) => <div className="sk-body-row" key={i}><span className="skeleton-block sk-number" /><div><span className="skeleton-block sk-description" /><span className="skeleton-block sk-sentence" /></div></div>)}</div> : view === 'community' ? <div className="sk-community-grid">{Array.from({length:4}, (_, i) => <div className="skeleton-panel sk-community-card" key={i}><span className="skeleton-block sk-cover" /><span className="skeleton-block sk-sentence" /><span className="skeleton-block sk-description" /></div>)}</div> : <><div className="sk-toolbar"><span className="skeleton-block sk-eyebrow" /><span className="skeleton-block sk-search" /></div><div className="sk-library">{Array.from({length:5}, (_, i) => <div className="skeleton-panel sk-library-row" key={i}><span className="skeleton-block sk-cover" /><div><span className="skeleton-block sk-sentence" /><span className="skeleton-block sk-description" /></div></div>)}</div></>}
    </div>
    <p className="loading-caption"><span className="spinner" aria-hidden="true" />학습 공간을 준비하고 있어요</p>
  </section>
}
