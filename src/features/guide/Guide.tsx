import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Screen } from '../../shared/model/navigation'

type Step = [string, string, string]
const guides: Partial<Record<Screen, Step[]>> = {
  home: [
    ['[data-guide="intro"]', '나만의 문장으로 배우는 영어', '플래시카드, 받아쓰기, 마스킹으로 한 문장을 여러 방식으로 익혀요.'],
    ['.sidebar-nav button:nth-child(3), .bottom-nav button:nth-child(3)', '커뮤니티', '누구나 공개 스크립트를 둘러보고 원문을 미리 볼 수 있어요.'],
    ['.sidebar-nav button:nth-child(2), .bottom-nav button:nth-child(2)', '내 스크립트', '로그인하면 나만의 스크립트를 만들고 학습을 이어갈 수 있어요.'],
    ['.account-profile, .account-login, .bottom-nav button:last-child', '마이 메뉴', '로그인과 회원가입, 계정 관리는 이곳에서 시작해요.'],
    ['[data-guide="start"]', '바로 체험해 보세요', '가입 없이 전용 스크립트로 세 가지 학습을 이용할 수 있어요. 체험 기록은 저장되지 않아요.'],
  ],
  about: [
    ['[data-guide="intro"]', '나만의 문장으로 배우는 영어', '플래시카드, 받아쓰기, 마스킹으로 영어 본문을 효율적으로 암기하세요.'],
    ['[data-guide="start"]', '무료 체험', '전용 스크립트로 세 가지 학습을 체험할 수 있어요.'],
  ],
  editor: [
    ['.sentence-editor', '문장 추가', '문장 사이의 + 버튼으로 한글 뜻과 영어 문장을 추가해요.'],
    ['.editor-modes', '카드와 원문 편집', '문장 카드와 원문 편집을 자유롭게 전환할 수 있어요.'],
    ['.card-drag-handle', '문장 순서 변경', '손잡이를 끌거나 위아래 방향키로 문장을 옮기세요.'],
    ['.editor-exclusions', '제외 단어 설정', '받아쓰기의 빈칸에서 제외할 단어 위치를 선택해요.'],
    ['.editor-page > .button-row', '저장', '편집을 마쳤다면 저장 버튼으로 내 스크립트에 보관하세요.'],
  ],
  flashcard: [
    ['.flashcard', '문장 공개', '카드를 누르거나 Space 키를 눌러 영어 문장을 확인해요.'],
    ['.study-actions', '기억 여부 평가', '다시 연습과 기억했어요로 평가하세요. 좌우 방향키도 사용할 수 있어요.'],
    ['.toggle-line', '취약 단어 기록', '단어 기록을 켜면 다시 연습을 선택한 뒤 어려운 단어를 골라 저장할 수 있어요.'],
    ['.star-button', '문장 별표', '다시 보고 싶은 문장에 별표를 남기고 별표 범위로 학습하세요.'],
  ],
  dictation: [
    ['.sentence-line', '빈칸 입력', '가려진 단어를 입력하세요. Enter로 다음 빈칸으로 이동해요.'],
    ['.question-card .primary-btn', '채점', '문장을 완성한 뒤 채점하기를 눌러 확인하세요.'],
    ['.question-card', '결과 수정', '채점 후 오답 옆의 정답을 누르면 정답 처리로 수정할 수 있어요.'],
    ['.study-header', '오답 재학습', '모든 문장을 마치면 결과 화면에서 틀린 문제만 다시 풀 수 있어요.'],
  ],
  masking: [
    ['[data-guide="mask"]', '단어 공개와 가리기', '단어마다 눌러서 공개하고, 다시 눌러 가리세요.'],
    ['[data-guide="mask-all"]', '전체 공개', '문장 전체를 공개하거나 한 번에 다시 가릴 수 있어요.'],
    ['.study-actions', '맞음과 틀림 평가', '문장을 떠올린 뒤 맞았어요 또는 틀렸어요를 선택하세요. 회원은 평가와 진행 상황이 저장되고 틀린 문장을 복습할 수 있어요.'],
    ['[data-guide="mask-words"]', '취약 단어 기록', '어려웠던 단어를 선택해 기존 취약 단어 기록에 함께 보관하세요. 체험에서는 저장되지 않아요.'],
  ],
}
const keyOf = (screen: Screen) => `molip-guide-v1:${screen === 'about' ? 'home' : screen}`
function unseen(screen: Screen) { try { return !localStorage.getItem(keyOf(screen)) && (!['home', 'about'].includes(screen) || !localStorage.getItem('molip-guide-v1:about')) } catch { return true } }
export function Guide({ screen }: { screen: Screen }) {
  const steps = guides[screen]
  const [open, setOpen] = useState(() => Boolean(steps && unseen(screen)))
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const step = steps?.[index]
  useLayoutEffect(() => {
    if (!open || !step) return
    let target: HTMLElement | undefined
    const update = () => {
      target = Array.from(document.querySelectorAll<HTMLElement>(step[0])).find(el => el.getBoundingClientRect().width > 0)
      setRect(target?.getBoundingClientRect() ?? null)
    }
    update()
    target?.scrollIntoView({ block: 'center', behavior: 'instant' })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(document.body)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => { observer.disconnect(); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true) }
  }, [open, step])
  useEffect(() => {
    if (!open) return
    // Remember showing the guide even if the user leaves before its final step.
    try { localStorage.setItem(keyOf(screen), 'done') } catch { /* Storage is optional. */ }
    dialog.current?.focus()
  }, [open, index, screen])
  const close = () => { try { localStorage.setItem(keyOf(screen), 'done') } catch { /* Storage is optional. */ } setOpen(false); trigger.current?.focus() }
  if (!steps) return null
  const focus = rect ? {
    top: Math.max(0, rect.top - 5), left: Math.max(0, rect.left - 5),
    right: Math.min(window.innerWidth, rect.right + 5), bottom: Math.min(window.innerHeight, rect.bottom + 5),
  } : null
  const blurAreas = focus ? [
    { top: 0, left: 0, width: '100%', height: focus.top },
    { top: focus.bottom, left: 0, width: '100%', bottom: 0 },
    { top: focus.top, left: 0, width: focus.left, height: Math.max(0, focus.bottom - focus.top) },
    { top: focus.top, left: focus.right, right: 0, height: Math.max(0, focus.bottom - focus.top) },
  ] : []
  const top = rect && rect.bottom + 220 < window.innerHeight ? Math.max(16, rect.bottom + 14) : Math.max(16, Math.min((rect?.top ?? 240) - 220, window.innerHeight - 240))
  return <><button ref={trigger} className="guide-help" onClick={() => { setIndex(0); setOpen(true) }} aria-label="이 화면 도움말">? 도움말</button>{open && step && createPortal(<div className="guide-layer" onKeyDown={event => {
    if (event.key === 'Escape') close()
    if (event.key === 'Tab') { const nodes = dialog.current?.querySelectorAll<HTMLButtonElement>('button'); if (!nodes?.length) return; const first = nodes[0], last = nodes[nodes.length - 1]; if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus() } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() } }
  }}>{blurAreas.map((style, area) => <div key={area} className="guide-blur-area" style={style} />)}<div className="guide-shade" />{rect && <div className="guide-spotlight" style={{ top: Math.max(0, rect.top - 5), left: Math.max(0, rect.left - 5), width: Math.min(rect.width + 10, window.innerWidth - Math.max(0, rect.left - 5)), height: Math.min(rect.height + 10, window.innerHeight) }} />}<div key={index} ref={dialog} tabIndex={-1} className="guide-dialog" role="dialog" aria-modal="true" aria-labelledby="guide-title" style={{ top, left: Math.max(16, Math.min(rect?.left ?? 24, window.innerWidth - 356)) }}><small>{index + 1} / {steps.length}</small><h2 id="guide-title">{step[1]}</h2><p>{step[2]}</p><div className="button-row"><button onClick={close}>건너뛰기</button><button disabled={!index} onClick={() => setIndex(index - 1)}>이전</button><button className="primary-btn" onClick={() => index === steps.length - 1 ? close() : setIndex(index + 1)}>{index === steps.length - 1 ? '완료' : '다음'}</button></div></div></div>, document.body)}</>
}
