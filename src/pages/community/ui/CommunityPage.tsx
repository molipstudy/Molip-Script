import { useId, useState } from 'react'
import { useCommunityStats } from '../../../features/community-social/model/useCommunityStats'
import { CommunityCounts } from '../../../features/community-social/ui/CommunityCounts'
import { CommunityComments } from '../../../features/community-social/ui/CommunityComments'
import type { CommunityScript } from '../../../entities/community'
import type { ScriptRecord } from '../../../entities/script'
import { parseItems } from '../../../entities/script'
import { formatDateTime } from '../../../shared/lib'
import { AsyncButton, Icon, IconButton, LoadingSkeleton, Modal, StudyTip } from '../../../shared/ui'

type CommunityPageProps = {
  onPublisher: (id: string) => void
  onRequireLogin: () => void
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

  const [view, setView] = useState<'cards' | 'list'>(() => {
    try { return localStorage.getItem('molip-community-view') === 'list' ? 'list' : 'cards' } catch { return 'cards' }
  })
  const [collapsedScriptId, setCollapsedScriptId] = useState<string | null>(null)
  const bodyId = useId()
  const selectScript = (id: string | null) => { setCollapsedScriptId(null); onSelect(id) }
  const changeView = (next: 'cards' | 'list') => {
    setView(next)
    try { localStorage.setItem('molip-community-view', next) } catch { /* The layout still works without storage. */ }
  }
  const social = useCommunityStats(scripts, userId)

  if (selectedId) {
    if (!selected) {
      return loading ? <LoadingSkeleton view="script" /> : <section className="empty-state"><h2>공유된 스크립트를 찾을 수 없어요</h2><p>공유가 취소되었거나 삭제된 자료예요.</p><button onClick={() => selectScript(null)}><Icon name="back" />커뮤니티로</button></section>
    }
    const items = parseItems(selected.rawText)
    const isOwner = selected.ownerId === userId
    return (
      <section className="script-detail-page" key={selectedId}>
        <div className="script-hero">
          <div><button className="text-btn" onClick={() => selectScript(null)}><Icon name="back" />커뮤니티</button><h1>{selected.title}</h1><p><button className="text-btn publisher-link" onClick={() => props.onPublisher(selected.ownerId)}>{selected.ownerLoginId}</button> · 문장 {items.length}개 · 공유 {formatDateTime(selected.sharedAt)}</p></div>
          <div className="script-actions">
            {isOwner
              ? <button className="danger-btn" disabled={busy} onClick={() => void onUnshare(selected)}>{busy ? <span className="spinner" /> : <Icon name="share" />}공유 취소</button>
              : <button className="primary-btn" disabled={busy} onClick={() => { void onCopy(selected).then(() => social.reload()) }}>{busy ? <span className="spinner" /> : <Icon name="copy" />}내 스크립트에 담기</button>}
          </div>
        </div>
        {notice && <p className="notice-text" role="status">{notice}</p>}
        <div className="community-social-bar"><AsyncButton className={`like-button ${social.stats[selectedId]?.liked ? 'active' : ''}`} aria-pressed={Boolean(social.stats[selectedId]?.liked)} disabled={social.busy || (!social.stats[selectedId] && Boolean(userId))} onAction={async () => { if (!userId) props.onRequireLogin(); else await social.like(selectedId) }}><Icon name="heart" />좋아요{social.stats[selectedId] ? ` ${social.stats[selectedId].like_count}` : ''}</AsyncButton><CommunityCounts summary={social.stats[selectedId]} showLikes={false} /></div>
        {social.error && <p className="error-text" role="alert">{social.error} <button className="text-btn" onClick={() => void social.reload()}>다시 시도</button></p>}
        {!isOwner && <StudyTip context="community" />}
        <section className="body-panel">
          <div className="panel-top community-body-heading"><h2><Icon name="book" />스크립트 본문 <span className="count-badge">{items.length}</span></h2><div className="button-row">{collapsedScriptId !== selectedId && <button className={`reading-toggle ${showMeaning ? 'active' : ''}`} aria-pressed={showMeaning} onClick={() => onShowMeaningChange(!showMeaning)}><Icon name="eye" />해석</button>}<button className="text-btn" aria-expanded={collapsedScriptId !== selectedId} aria-controls={bodyId} onClick={() => setCollapsedScriptId(collapsedScriptId !== selectedId ? selectedId : null)}><Icon name={collapsedScriptId !== selectedId ? 'collapse' : 'expand'} />{collapsedScriptId !== selectedId ? '본문 접기' : '본문 펼치기'}</button></div></div>
          <div id={bodyId} hidden={collapsedScriptId === selectedId}><div className="script-body">{collapsedScriptId !== selectedId && items.map((item, index) => <article key={`${item.number}-${index}`}><span className="sentence-number">{String(index + 1).padStart(2, '0')}</span>{showMeaning && <p>{item.meaning}</p>}<strong>{item.english}</strong></article>)}</div></div>
        </section>
        <CommunityComments key={selectedId} scriptId={selectedId} userId={userId} onLogin={props.onRequireLogin} onPublisher={props.onPublisher} onChanged={social.reload} />
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
      <div className="community-browse-controls"><div className="community-browse-toolbar"><span className="muted">공개 스크립트 {filtered.length}개</span><div className="community-view-switch" role="group" aria-label="커뮤니티 보기 방식"><button className={view === 'list' ? 'active' : ''} aria-pressed={view === 'list'} onClick={() => changeView('list')}><Icon name="list" />목록형</button><button className={view === 'cards' ? 'active' : ''} aria-pressed={view === 'cards'} onClick={() => changeView('cards')}><Icon name="grid" />카드형</button></div></div>
      <label className="search-field community-search"><Icon name="search" /><input aria-label="커뮤니티 검색" placeholder="제목 또는 공유한 사람 검색" value={query} onChange={(event) => onQueryChange(event.target.value)} />{query && <IconButton icon="close" label="검색 지우기" onClick={() => onQueryChange('')} />}</label></div>
      {notice && <p className="notice-text">{notice}</p>}
      {social.error && <p className="muted">{social.error} <button className="text-btn" onClick={() => void social.reload()}>다시 시도</button></p>}

      {loading ? <LoadingSkeleton view="community" compact /> : scripts.length ? (
        <div className={`community-grid community-results community-results--${view}`}>
          {!filtered.length && <div className="empty-state"><h2>검색 결과가 없어요</h2><p>다른 제목이나 공유한 사람으로 검색해 보세요.</p></div>}
          {filtered.map((script) => (
            <article className="community-card" key={script.id}>
              <button className="community-card-open" onClick={() => selectScript(script.id)}><span className="community-card-icon"><Icon name="book" /><Icon name="arrow" /></span><strong>{script.title}</strong><span>문장 {parseItems(script.rawText).length}개</span></button>
              <div className="community-card-author"><button className="text-btn publisher-link" onClick={() => props.onPublisher(script.ownerId)}>{script.ownerLoginId}</button><small>{formatDateTime(script.sharedAt)}</small></div>
              <CommunityCounts summary={social.stats[script.id]} />
              {script.ownerId === userId && <em>내가 공유함</em>}
            </article>
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
