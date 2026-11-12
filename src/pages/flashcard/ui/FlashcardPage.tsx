import { StudyHeader } from '../../../features/learning-settings/ui/StudyHeader'
import { useEffect, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { QuizItem, SentenceStat } from '../../../entities/script'
import { sentenceKeyOf, sentenceTokens } from '../../../entities/script'
import { AsyncButton, Icon, IconButton, Modal, StudyTip } from '../../../shared/ui'

type FlashcardPageProps = {
  exitLabel: string
  items: QuizItem[]
  stats: Record<string, SentenceStat>
  queue: number[]
  index: number
  revealed: boolean
  unknownIndexes: number[]
  trackWords: boolean
  wordPickerOpen: boolean
  pendingIndex: number | null
  selectedWords: Set<string>
  onBack: () => Promise<unknown>
  onOpenSettings: () => void
  onMove: (direction: -1 | 1) => Promise<unknown>
  onTrackWordsChange: (value: boolean) => Promise<unknown>
  onRestart: () => Promise<unknown>
  onExit: () => void
  onReveal: () => Promise<unknown>
  onAdvance: (known: boolean) => Promise<unknown>
  onToggleStar: (item: QuizItem, index: number) => Promise<unknown>
  onToggleWord: (word: string) => void
  onCloseWordPicker: (save: boolean) => Promise<unknown>
}

export function FlashcardPage(props: FlashcardPageProps) {
  const {
    items, stats, queue, index, revealed, unknownIndexes, trackWords, wordPickerOpen,
    pendingIndex, selectedWords, onBack, onOpenSettings, onMove, onTrackWordsChange,
    onRestart, onExit, onReveal, onAdvance, onToggleStar, onToggleWord, onCloseWordPicker,
  } = props
  const done = index >= queue.length
  const sourceIndex = queue[index]
  const item = items[sourceIndex]
  const pickerItem = pendingIndex === null ? null : items[pendingIndex] ?? null
  const pickerWords = pickerItem ? sentenceTokens(pickerItem.english) : []
  const cardRef = useRef<HTMLButtonElement>(null)
  const wordChipRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    if (done || wordPickerOpen || !item) return
    const frame = window.requestAnimationFrame(() => {
      cardRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [done, index, item, wordPickerOpen])

  const handleWordPickerKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      void onCloseWordPicker(false)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      void onCloseWordPicker(true)
      return
    }
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || !pickerWords.length) return
    event.preventDefault()
    const currentIndex = wordChipRefs.current.findIndex((node) => node === document.activeElement)
    const direction = event.key === 'ArrowLeft' ? -1 : 1
    const nextIndex = currentIndex < 0
      ? 0
      : (currentIndex + direction + pickerWords.length) % pickerWords.length
    wordChipRefs.current[nextIndex]?.focus()
  }

  return (
    <section className="study-page learning-page">
      <StudyHeader title="플래시카드" index={index} total={queue.length} progress={index} done={done} previousDisabled={wordPickerOpen} nextDisabled={wordPickerOpen} exitLabel={props.exitLabel} onExit={onBack} onSettings={onOpenSettings} onMove={onMove}>
        <label className="toggle-line"><input type="checkbox" checked={trackWords} onChange={(event) => void onTrackWordsChange(event.target.checked)} />단어 기록</label>
      </StudyHeader>
      {!done && <StudyTip context="flashcard" />}
      {done ? (
        <section className="result-card">
          <h1>플래시카드 완료</h1><p>{queue.length}개의 문장을 학습했어요. 다시 연습할 문장은 {unknownIndexes.length}개예요.</p>
          <div className="button-row"><AsyncButton className="primary-btn" onAction={onRestart}>다시 학습</AsyncButton><button onClick={onExit}>스크립트로</button></div>
        </section>
      ) : item && (
        <>
          <section className="flashcard-shell" key={index}>
            <IconButton className={`star-button ${stats[sentenceKeyOf(item, sourceIndex)]?.starred ? 'active' : ''}`} icon="star" label={stats[sentenceKeyOf(item, sourceIndex)]?.starred ? '별표 해제' : '별표 표시'} aria-pressed={Boolean(stats[sentenceKeyOf(item, sourceIndex)]?.starred)} onClick={() => void onToggleStar(item, sourceIndex)} />
            <button ref={cardRef} className={`flashcard ${revealed ? 'revealed' : ''}`} aria-expanded={revealed} onClick={() => void onReveal()}>
              <span className="flash-label"><Icon name="cards" />SENTENCE {String(sourceIndex + 1).padStart(2, '0')}</span><strong>{item.meaning}</strong>
              {revealed ? <em className="flash-answer">{item.english}</em> : <span className="reveal-hint"><Icon name="eye" />눌러서 영어 문장 확인 <kbd>Space</kbd></span>}
              {revealed && <span className="reveal-hint">얼마나 잘 기억하고 있었나요?</span>}
            </button>
          </section>
          <div className="study-actions">
            <AsyncButton className="review-btn" disabled={!revealed} onAction={() => onAdvance(false)}><Icon name="reset" />다시 연습</AsyncButton>
            <AsyncButton className="success-btn recall-btn" disabled={!revealed} onAction={() => onAdvance(true)}><Icon name="check" />기억했어요</AsyncButton>
          </div>
        </>
      )}

      {wordPickerOpen && (
        <Modal label="어려웠던 단어 선택">
          <section className="word-modal" onKeyDown={handleWordPickerKeyDown}>
            <h2>어려웠던 단어 선택</h2><p>{pickerItem?.english}</p>
            <div className="word-chip-grid">{pickerWords.map((word, wordIndex) => <button ref={(node) => { wordChipRefs.current[wordIndex] = node }} key={wordIndex} className={selectedWords.has(String(wordIndex)) ? 'selected' : ''} onClick={() => onToggleWord(String(wordIndex))}>{word}</button>)}</div>
            <div className="button-row"><AsyncButton className="primary-btn" onAction={() => onCloseWordPicker(true)}><Icon name="check" />{selectedWords.size}개 기록</AsyncButton><AsyncButton onAction={() => onCloseWordPicker(false)}>넘기기</AsyncButton></div>
          </section>
        </Modal>
      )}
    </section>
  )
}
