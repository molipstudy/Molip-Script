import { Fragment, useRef, useState } from 'react'
import { normalizeWord, parseEditorItems, serializeItems } from '../../../entities/script'
import type { QuizItem } from '../../../entities/script'
import { AsyncButton, Icon, IconButton } from '../../../shared/ui'
import { moveCardToGap } from '../lib/reorder-cards'
import { useCardDrag } from '../lib/useCardDrag'
import { ExcludedWordsDialog } from './ExcludedWordsDialog'

type ScriptEditorPageProps = {
  editing: boolean
  title: string
  rawText: string
  excludedWords: string[]
  error: string
  onTitleChange: (value: string) => void
  onRawTextChange: (value: string) => void
  onExcludedWordsChange: (value: string[]) => void
  onCancel: () => void
  onSave: (excludedWords: string[]) => Promise<unknown>
  onDelete?: () => void
}

type Card = QuizItem & { id: string }
const cardOf = (item?: QuizItem): Card => ({ number: '1', meaning: '', english: '', ...item, id: crypto.randomUUID() })

export function ScriptEditorPage({ editing, title, rawText, excludedWords, error, onTitleChange, onRawTextChange, onExcludedWordsChange, onCancel, onSave, onDelete }: ScriptEditorPageProps) {
  const [mode, setMode] = useState<'cards' | 'raw'>(() => parseEditorItems(rawText) ? 'cards' : 'raw')
  const [cards, setCards] = useState<Card[]>(() => {
    const items = parseEditorItems(rawText)
    return items?.length ? items.map(cardOf) : [cardOf()]
  })
  const [notice, setNotice] = useState('')
  const [localError, setLocalError] = useState('')
  const [wordInput, setWordInput] = useState('')
  const [exclusionItems, setExclusionItems] = useState<QuizItem[] | null>(null)
  const cardRawSnapshot = useRef<string | null>(null)
  const inputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})
  const updateCards = (next: Card[]) => {
    setCards(next)
    onRawTextChange(serializeItems(next))
    setLocalError('')
    setNotice('')
  }
  const reorderCard = (id: string, gap: number) => {
    const next = moveCardToGap(cards, id, gap)
    if (next === cards) return
    const from = cards.findIndex((card) => card.id === id)
    const to = next.findIndex((card) => card.id === id)
    updateCards(next)
    setNotice(`${from + 1}번째 문장을 ${to + 1}번째로 옮겼어요.`)
  }
  const { listRef, drag, start: startDrag, move: moveDrag, end: endDrag, cancel: cancelDrag } = useCardDrag(reorderCard)
  const insertCard = (index: number) => {
    const card = cardOf()
    updateCards([...cards.slice(0, index), card, ...cards.slice(index)].map((item, i) => ({ ...item, number: String(i + 1) })))
    requestAnimationFrame(() => inputRefs.current[card.id]?.focus())
  }
  const switchMode = (next: 'cards' | 'raw') => {
    if (next === mode) return
    setLocalError('')
    cancelDrag()
    if (next === 'raw') {
      // Keep unfinished cards intact so switching views never blocks editing.
      cardRawSnapshot.current = rawText
      setMode('raw')
      return
    }
    if (rawText === cardRawSnapshot.current) {
      setMode('cards')
      return
    }
    if (next === 'cards') {
      const items = parseEditorItems(rawText)
      if (!items) {
        setLocalError('문장 카드로 바꾸려면 각 문장을 “번호. 한글 뜻”과 다음 줄의 영어 문장으로 정리해 주세요. 본문·Wrap Up 같은 구분 줄은 자동으로 건너뜁니다.')
        return
      }
      setCards(items.length ? items.map(cardOf) : [cardOf()])
    }
    setMode(next)
  }
  const pendingWords = () => Array.from(new Set([...excludedWords, ...wordInput.split(/[\s,;]+/).map(normalizeWord).filter(Boolean)]))
  const addWords = () => {
    onExcludedWordsChange(pendingWords())
    setWordInput('')
  }
  const save = async () => {
    if (mode === 'cards' && cards.some((card) => !card.meaning.trim() || !card.english.trim())) {
      setLocalError('각 카드의 한글 뜻과 영어 문장을 채우거나 빈 카드를 삭제해 주세요.')
      return
    }
    const items = parseEditorItems(rawText)
    if (!items?.length) {
      setLocalError('각 문장에 번호, 한글 뜻, 다음 줄의 영어 문장을 빠짐없이 입력해 주세요.')
      return
    }
    setLocalError('')
    const words = pendingWords()
    onExcludedWordsChange(words)
    setWordInput('')
    await onSave(words)
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rawText)
      setNotice('원문 형식으로 복사했어요.')
    } catch {
      setLocalError('복사하지 못했어요. 원문 편집에서 본문을 선택해 복사해 주세요.')
    }
  }
  const insertButton = (index: number) => <button className={`insert-sentence${drag?.gap === index ? ' is-drop-target' : ''}`} onClick={() => insertCard(index)} aria-label={`${index === 0 ? '맨 처음' : `${index}번째 문장 다음`}에 문장 추가`}><Icon name="plus" /><span>문장 추가</span></button>

  return (
    <section className="editor-page">
      <div className="page-top"><div><p className="eyebrow">Script Editor</p><h1>{editing ? '스크립트 수정' : '스크립트 추가'}</h1></div><button onClick={onCancel}>취소</button></div>
      <label className="field"><span>제목</span><input value={title} onChange={(event) => onTitleChange(event.target.value)} /></label>
      <div className="editor-toolbar">
        <div className="editor-modes" role="group" aria-label="편집 형식">
          <button aria-pressed={mode === 'cards'} onClick={() => switchMode('cards')}><Icon name="cards" />문장 카드</button>
          <button aria-pressed={mode === 'raw'} onClick={() => switchMode('raw')}><Icon name="edit" />원문 편집</button>
        </div>
        <AsyncButton onAction={copy}><Icon name="copy" />원문 복사</AsyncButton>
      </div>
      {mode === 'cards' ? <div className={`sentence-editor${drag ? ' is-sorting' : ''}`} ref={listRef} onKeyDown={(event) => { if (event.key === 'Escape') cancelDrag() }}>
        <p className="editor-hint">왼쪽 손잡이를 끌어 순서를 바꾸고, + 버튼으로 문장을 추가하세요.</p>
        <span className="sr-only" id="card-drag-help">끌어서 원하는 위치에 놓으세요. 위아래 방향키로도 이동할 수 있어요. Escape는 끌기 취소입니다.</span>
        {insertButton(0)}
        {cards.map((card, index) => <Fragment key={card.id}>
          <article data-sort-card={card.id} className={`sentence-card${drag?.id === card.id ? ' is-dragging' : ''}`}>
            <div className="sentence-card-heading"><div className="sentence-card-position"><strong aria-label={`문장 ${index + 1}`}>{index + 1}</strong>
              <button className="card-drag-handle" aria-label={`${index + 1}번째 문장 순서 변경`} title="끌어서 순서 변경 · ↑↓ 키로 이동" aria-describedby="card-drag-help" disabled={cards.length < 2}
                onPointerDown={(event) => startDrag(event, card.id)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}
                onKeyDown={(event) => {
                  if (drag) return
                  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                    event.preventDefault()
                    reorderCard(card.id, event.key === 'ArrowUp' ? index - 1 : index + 2)
                  }
                }}><svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor" aria-hidden="true"><circle cx="5" cy="5" r="1.5" /><circle cx="11" cy="5" r="1.5" /><circle cx="5" cy="10" r="1.5" /><circle cx="11" cy="10" r="1.5" /><circle cx="5" cy="15" r="1.5" /><circle cx="11" cy="15" r="1.5" /></svg></button>
            </div><IconButton icon="trash" label={`${index + 1}번째 문장 삭제`} onClick={() => {
              if ((card.meaning || card.english) && !window.confirm('이 문장을 삭제할까요?')) return
              updateCards(cards.filter((item) => item.id !== card.id).map((item, i) => ({ ...item, number: String(i + 1) })))
            }} /></div>
            <div className="sentence-fields">
              <label className="field"><span>한글</span><textarea ref={(element) => { inputRefs.current[card.id] = element }} rows={1} value={card.meaning} placeholder="한글 뜻" onChange={(event) => updateCards(cards.map((item) => item.id === card.id ? { ...item, meaning: event.target.value.replace(/[\r\n]+/g, ' ') } : item))} /></label>
              <label className="field"><span>영어</span><textarea rows={1} lang="en" value={card.english} placeholder="English sentence" onChange={(event) => updateCards(cards.map((item) => item.id === card.id ? { ...item, english: event.target.value.replace(/[\r\n]+/g, ' ') } : item))} /></label>
            </div>
          </article>
          {insertButton(index + 1)}
        </Fragment>)}
      </div> : <label className="field"><span>본문 · 번호. 한글 뜻 다음 줄에 영어 문장을 입력하세요</span><textarea value={rawText} onChange={(event) => { onRawTextChange(event.target.value); setLocalError(''); setNotice('') }} spellCheck={false} placeholder={'1. 한글 뜻\nEnglish sentence.\n\n2. 한글 뜻\nEnglish sentence.'} /></label>}
      <section className="editor-exclusions" aria-labelledby="exclusions-heading">
        <h2 id="exclusions-heading">받아쓰기 제외 단어</h2>
        <p className="editor-hint">본문에서 단어를 눌러 빈칸 출제에서 제외할 수 있어요.</p>
        <button className="exclusion-open-button" onClick={() => {
          const items = mode === 'cards' ? cards : parseEditorItems(rawText)
          if (!items) {
            setLocalError('본문 전체를 표시하려면 각 문장을 “번호. 한글 뜻”과 다음 줄의 영어 문장으로 정리해 주세요.')
            return
          }
          addWords()
          setLocalError('')
          setExclusionItems(items)
        }}><Icon name="edit" />본문에서 제외 단어 선택<span>{excludedWords.length}개 제외</span></button>
        <div className="exclusion-repeat-settings">
          <h3>반복 표기 · 직접 입력</h3>
          <p className="editor-hint">W:, B:처럼 반복되는 화자 표기나 단어는 한 번에 입력하세요. 본문 전체에서 제외돼요.</p>
          <div className="exclusion-input"><label className="field"><span>쉼표나 공백으로 구분</span><input value={wordInput} placeholder="예: W:, B:" onChange={(event) => setWordInput(event.target.value)} onBlur={addWords} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); addWords() } }} /></label><button onClick={addWords}><Icon name="plus" />추가</button></div>
        </div>
        <div className="excluded-words">{excludedWords.map((word) => <button key={word} aria-label={`${word} 제외 해제`} onClick={() => onExcludedWordsChange(excludedWords.filter((item) => item !== word))}>{word}<Icon name="close" /></button>)}</div>
        {!excludedWords.length && <p className="editor-hint">제외한 단어가 없어요.</p>}
      </section>
      {exclusionItems !== null && <ExcludedWordsDialog
        items={exclusionItems}
        excludedWords={excludedWords}
        onClose={() => setExclusionItems(null)}
        onApply={(words) => {
          onExcludedWordsChange(words)
          setExclusionItems(null)
          setNotice('제외 단어를 적용했어요. 스크립트를 저장해 주세요.')
        }}
      />}
      {(localError || error) && <p className="error-text" role="alert">{localError || error}</p>}
      <p className="editor-status" role="status">{notice}</p>
      <div className="button-row"><AsyncButton className="primary-btn" onAction={save}><Icon name="check" />저장</AsyncButton>{editing && onDelete && <button className="danger-btn" onClick={onDelete}>삭제</button>}</div>
    </section>
  )
}
