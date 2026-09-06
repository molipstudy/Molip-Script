import type { ScriptRecord } from '../../../entities/script'
import type { StudyScope } from '../../../entities/learning'
import { clamp } from '../../../shared/lib'
import { AsyncButton, Icon, Modal } from '../../../shared/ui'

type StudyKind = 'flashcard' | 'dictation'

type StudySettingsDialogProps = {
  script: ScriptRecord
  sentenceCount: number
  kind: StudyKind
  scope: StudyScope
  rangeStart: number
  rangeEnd: number
  blankPercent: number
  trackWords: boolean
  error: string
  onClose: () => void
  onKindChange: (kind: StudyKind) => void
  onScopeChange: (scope: StudyScope) => void
  onRangeStartChange: (value: number) => void
  onRangeEndChange: (value: number) => void
  onBlankPercentChange: (value: number) => void
  onTrackWordsChange: (value: boolean) => void
  onStart: () => Promise<unknown>
}

export function StudySettingsDialog({
  script,
  sentenceCount,
  kind,
  scope,
  rangeStart,
  rangeEnd,
  blankPercent,
  trackWords,
  error,
  onClose,
  onKindChange,
  onScopeChange,
  onRangeStartChange,
  onRangeEndChange,
  onBlankPercentChange,
  onTrackWordsChange,
  onStart,
}: StudySettingsDialogProps) {
  return (
    <Modal label="학습 설정" onClose={onClose}>
      <section className="study-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div><p className="eyebrow">Study</p><h2>어떻게 공부할까요?</h2><p className="page-description">{script.title}</p></div>
          <button className="text-btn modal-close" onClick={onClose}><Icon name="close" /><span className="sr-only">닫기</span></button>
        </div>

        <div className="study-type-tabs" role="group" aria-label="학습 종류">
          <button aria-pressed={kind === 'flashcard'} className={kind === 'flashcard' ? 'active' : ''} onClick={() => onKindChange('flashcard')}>
            <Icon name="cards" /><strong>플래시카드</strong><small>떠올리고, 뒤집고, 기억해요</small>
          </button>
          <button aria-pressed={kind === 'dictation'} className={kind === 'dictation' ? 'active' : ''} onClick={() => onKindChange('dictation')}>
            <Icon name="pen" /><strong>받아쓰기</strong><small>빈칸을 채우며 정확하게</small>
          </button>
        </div>

        <div className="study-settings">
          <fieldset className="scope-picker">
            <legend>학습할 문장</legend>
            <div>
              {([['all', '전체'], ['weak', '취약'], ['starred', '별표'], ['range', '범위 지정']] as const).map(([value, label]) => (
                <button type="button" className={scope === value ? 'active' : ''} aria-pressed={scope === value} key={value} onClick={() => onScopeChange(value)}>
                  {value === 'starred' && <Icon name="star" />}{label}
                </button>
              ))}
            </div>
          </fieldset>
          {scope === 'range' && (
            <div className="range-picker">
              <label><span>시작</span><input type="number" min="1" max={sentenceCount} value={rangeStart} onChange={(event) => onRangeStartChange(clamp(Number(event.target.value) || 1, 1, sentenceCount))} /></label>
              <span>–</span>
              <label><span>끝</span><input type="number" min="1" max={sentenceCount} value={rangeEnd} onChange={(event) => onRangeEndChange(clamp(Number(event.target.value) || 1, 1, sentenceCount))} /></label>
              <small>총 {Math.abs(rangeEnd - rangeStart) + 1}문장</small>
            </div>
          )}
          {kind === 'flashcard' ? (
            <label className="check-line"><input type="checkbox" checked={trackWords} onChange={(event) => onTrackWordsChange(event.target.checked)} />‘다시 연습’ 선택 후 어려운 단어 기록</label>
          ) : (
            <>
              <label className="slider-field"><span>빈칸 비율<strong>{blankPercent}%</strong></span><input type="range" min="30" max="100" step="10" value={blankPercent} onChange={(event) => onBlankPercentChange(Number(event.target.value))} /></label>
              <p className="setting-note">틀린 문장과 단어를 기록하고 취약 단어를 우선 빈칸 처리합니다.</p>
            </>
          )}
          {error && <p className="error-text">{error}</p>}
        </div>
        <AsyncButton className="primary-btn full-btn" onAction={onStart}>{kind === 'flashcard' ? '플래시카드 시작' : '받아쓰기 시작'}</AsyncButton>
      </section>
    </Modal>
  )
}
