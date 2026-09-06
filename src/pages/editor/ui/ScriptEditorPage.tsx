import { AsyncButton, Icon } from '../../../shared/ui'

type ScriptEditorPageProps = {
  editing: boolean
  title: string
  rawText: string
  error: string
  onTitleChange: (value: string) => void
  onRawTextChange: (value: string) => void
  onCancel: () => void
  onSave: () => Promise<unknown>
  onDelete?: () => void
}

export function ScriptEditorPage({ editing, title, rawText, error, onTitleChange, onRawTextChange, onCancel, onSave, onDelete }: ScriptEditorPageProps) {
  return (
    <section className="editor-page">
      <div className="page-top"><div><p className="eyebrow">Script Editor</p><h1>{editing ? '스크립트 수정' : '스크립트 추가'}</h1></div><button onClick={onCancel}>취소</button></div>
      <label className="field"><span>제목</span><input value={title} onChange={(event) => onTitleChange(event.target.value)} /></label>
      <label className="field"><span>본문</span><textarea value={rawText} onChange={(event) => onRawTextChange(event.target.value)} spellCheck={false} placeholder={'1. 한글 뜻\nEnglish sentence.\n\n2. 한글 뜻\nEnglish sentence.'} /></label>
      {error && <p className="error-text">{error}</p>}
      <div className="button-row">
        <AsyncButton className="primary-btn" onAction={onSave}><Icon name="check" />저장</AsyncButton>
        {editing && onDelete && <button className="danger-btn" onClick={onDelete}>삭제</button>}
      </div>
    </section>
  )
}
