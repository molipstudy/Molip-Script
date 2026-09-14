import { useState } from 'react'
import { normalizeWord, parseTokenParts } from '../../../entities/script'
import type { QuizItem } from '../../../entities/script'
import { Icon, IconButton, Modal } from '../../../shared/ui'

type ExcludedWordsDialogProps = {
  items: QuizItem[]
  excludedWords: string[]
  onClose: () => void
  onApply: (words: string[]) => void
}

export function ExcludedWordsDialog({ items, excludedWords, onClose, onApply }: ExcludedWordsDialogProps) {
  const [selected, setSelected] = useState(() => new Set(excludedWords))
  const toggle = (word: string) => setSelected((previous) => {
    const next = new Set(previous)
    if (next.has(word)) next.delete(word)
    else next.add(word)
    return next
  })

  return <Modal label="본문에서 받아쓰기 제외 단어 선택" onClose={onClose}>
    <section className="exclusion-dialog">
      <header className="exclusion-dialog-header">
        <div><p className="eyebrow">Dictation Settings</p><h2>본문에서 제외 단어 선택</h2></div>
        <IconButton icon="close" label="제외 단어 선택 닫기" onClick={onClose} />
      </header>
      <p className="editor-hint">단어를 누르면 빈칸에서 제외돼요. 다시 누르면 해제됩니다. 같은 단어는 본문 전체에 함께 적용되며, 대소문자와 주변 문장부호는 구분하지 않아요.</p>
      <div className="exclusion-body">
        {items.length ? items.map((item, index) => <article className="exclusion-sentence" key={index}>
          <p className="exclusion-meaning"><strong>{item.number}.</strong> {item.meaning || '한글 뜻을 입력하지 않은 문장'}</p>
          <div className="exclusion-tokens" lang="en">
            {item.english.split(/\s+/).filter(Boolean).map((token, tokenIndex) => {
              const word = normalizeWord(parseTokenParts(token).core)
              const excluded = selected.has(word)
              return word ? <button
                key={tokenIndex}
                className="exclusion-token"
                aria-pressed={excluded}
                aria-label={`${token} ${excluded ? '제외 해제' : '받아쓰기에서 제외'}`}
                onClick={() => toggle(word)}
              >{token}{excluded && <Icon name="check" />}</button> : <span key={tokenIndex}>{token}</span>
            })}
          </div>
          {!item.english.trim() && <p className="editor-hint">영어 문장을 입력하면 단어를 선택할 수 있어요.</p>}
        </article>) : <p className="editor-hint">먼저 본문에 한글 뜻과 영어 문장을 입력해 주세요.</p>}
      </div>
      <footer className="exclusion-dialog-footer">
        <span className="editor-hint" role="status">제외 단어 {selected.size}개</span>
        <div className="button-row"><button onClick={onClose}>취소</button><button className="primary-btn" onClick={() => onApply([...selected])}><Icon name="check" />적용</button></div>
      </footer>
      <p className="editor-hint">적용 후 스크립트를 저장하면 새로 시작하는 받아쓰기부터 반영돼요.</p>
    </section>
  </Modal>
}
