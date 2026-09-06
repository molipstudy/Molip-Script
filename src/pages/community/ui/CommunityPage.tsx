import type { CommunityScript } from '../../../entities/community'
import type { ScriptRecord } from '../../../entities/script'
import { parseItems } from '../../../entities/script'
import { formatDateTime } from '../../../shared/lib'
import { Icon, IconButton, LoadingSkeleton, Modal, StudyTip } from '../../../shared/ui'

type CommunityPageProps = {
  userId: string
  scripts: CommunityScript[]
  libraryScripts: ScriptRecord[]
  selected: CommunityScript | null
  selectedId: string | null
  query: string
  notice: string
  loading: boolean
  busy: boolean
  sharePickerOpen: boolean
  showMeaning: boolean
  onSelect: (id: string | null) => void
  onQueryChange: (value: string) => void
  onSharePickerChange: (open: boolean) => void
  onShowMeaningChange: (show: boolean) => void
  onShare: (script: ScriptRecord) => Promise<unknown>
  onUnshare: (script: CommunityScript) => Promise<unknown>
  onCopy: (script: CommunityScript) => Promise<unknown>
}

export function CommunityPage(props: CommunityPageProps) {
  const {
    userId, scripts, libraryScripts, selected, selectedId, query, notice, loading, busy,
    sharePickerOpen, showMeaning, onSelect, onQueryChange, onSharePickerChange,
    onShowMeaningChange, onShare, onUnshare, onCopy,
  } = props

  if (selectedId) {
    if (!selected) {
      return loading ? <LoadingSkeleton view="script" /> : <section className="empty-state"><h2>공유된 스크립트를 찾을 수 없어요</h2><p>공유가 취소되었거나 삭제된 자료예요.</p><button onClick={() => onSelect(null)}><Icon name="back" />커뮤니티로</button></section>
    }
    const items = parseItems(selected.rawText)
    const isOwner = selected.ownerId === userId
    return (
      <section className="script-detail-page" key={selectedId}>
        <div className="script-hero">
          <div><button className="text-btn" onClick={() => onSelect(null)}><Icon name="back" />커뮤니티</button><h1>{selected.title}</h1><p>{selected.ownerLoginId} · 문장 {items.length}개 · 공유 {formatDateTime(selected.sharedAt)}</p></div>
          <div className="script-actions">
            {isOwner
              ? <button className="danger-btn" disabled={busy} onClick={() => void onUnshare(selected)}>{busy ? <span className="spinner" /> : <Icon name="share" />}공유 취소</button>
              : <button className="primary-btn" disabled={busy} onClick={() => void onCopy(selected)}>{busy ? <span className="spinner" /> : <Icon name="copy" />}내 서재에 담기</button>}
          </div>
        </div>
        {notice && <p className="notice-text" role="status">{notice}</p>}
        {!isOwner && <StudyTip context="community" />}
        <section className="body-panel">
          <div className="panel-top"><h2><Icon name="book" />스크립트 본문 <span className="count-badge">{items.length}</span></h2><button className={`reading-toggle ${showMeaning ? 'active' : ''}`} aria-pressed={showMeaning} onClick={() => onShowMeaningChange(!showMeaning)}><Icon name="eye" />해석</button></div>
          <div className="script-body">{items.map((item, index) => <article key={`${item.number}-${index}`}><span className="sentence-number">{String(index + 1).padStart(2, '0')}</span>{showMeaning && <p>{item.meaning}</p>}<strong>{item.english}</strong></article>)}</div>
        </section>
      </section>
    )
  }

  const sharedSourceIds = new Set(scripts.filter((script) => script.ownerId === userId).map((script) => script.sourceScriptId))
  const filtered = scripts.filter((script) => `${script.title} ${script.ownerLoginId}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <section className="community-page">
      <div className="page-top compact">
        <div><p className="eyebrow">Community</p><h1>함께 공부하는 서재</h1><p className="page-description">좋은 스크립트를 발견하고, 나의 학습으로 이어가세요.</p></div>
        <button className="primary-btn" onClick={() => onSharePickerChange(true)}><Icon name="share" />스크립트 공유</button>
      </div>
      <StudyTip context="community" />
      <label className="search-field"><Icon name="search" /><input aria-label="커뮤니티 검색" placeholder="제목 또는 공유한 사람 검색" value={query} onChange={(event) => onQueryChange(event.target.value)} />{query && <IconButton icon="close" label="검색 지우기" onClick={() => onQueryChange('')} />}</label>
      {notice && <p className="notice-text">{notice}</p>}

      {loading ? <LoadingSkeleton view="community" compact /> : scripts.length ? (
        <div className="community-grid">
          {!filtered.length && <div className="empty-state"><h2>검색 결과가 없어요</h2><p>다른 제목이나 공유한 사람으로 검색해 보세요.</p></div>}
          {filtered.map((script) => (
            <button className="community-card" key={script.id} onClick={() => onSelect(script.id)}>
              <span className="community-card-icon"><Icon name="book" /><Icon name="arrow" /></span><strong>{script.title}</strong>
              <span>문장 {parseItems(script.rawText).length}개</span><small>{script.ownerLoginId} · {formatDateTime(script.sharedAt)}</small>
              {script.ownerId === userId && <em>내가 공유함</em>}
            </button>
          ))}
        </div>
      ) : <div className="empty-state"><h2>아직 공유된 스크립트가 없습니다.</h2><p>내 스크립트를 공유해 첫 커뮤니티 자료를 만들어 보세요.</p></div>}

      {sharePickerOpen && (
        <Modal label="공유할 스크립트 선택" onClose={() => onSharePickerChange(false)}>
          <section className="study-modal share-picker" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head"><div><p className="eyebrow">Share</p><h2>공유할 스크립트 선택</h2></div><button className="text-btn modal-close" onClick={() => onSharePickerChange(false)} aria-label="닫기"><Icon name="close" /></button></div>
            {libraryScripts.length ? (
              <div className="script-list">
                {libraryScripts.map((script) => {
                  const isShared = sharedSourceIds.has(script.id)
                  return <button key={script.id} className="script-row" disabled={isShared || busy} onClick={() => void onShare(script)}><span><strong>{script.title}</strong><small>{isShared ? '이미 공유 중' : `문장 ${parseItems(script.rawText).length}개`}</small></span><span className="row-arrow">{isShared ? '✓' : '›'}</span></button>
                })}
              </div>
            ) : <div className="empty-state slim"><p>먼저 홈에서 스크립트를 추가해 주세요.</p></div>}
          </section>
        </Modal>
      )}
    </section>
  )
}
