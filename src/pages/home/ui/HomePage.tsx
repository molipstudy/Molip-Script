import type { ScriptRecord } from '../../../entities/script'
import { parseItems } from '../../../entities/script'
import { formatDateTime } from '../../../shared/lib'
import { Icon, IconButton } from '../../../shared/ui'
import { InstallAppBanner } from '../../../features/install-app'

type HomePageProps = {
  scripts: ScriptRecord[]
  query: string
  onQueryChange: (value: string) => void
  onAddScript: () => void
  onOpenScript: (scriptId: string) => void
}

export function HomePage({ scripts, query, onQueryChange, onAddScript, onOpenScript }: HomePageProps) {
  const filtered = scripts.filter((script) => script.title.toLowerCase().includes(query.toLowerCase()))
  return (
    <section className="home-surface">
      <InstallAppBanner />
      <div className="page-top compact">
        <div><p className="eyebrow">Scripts</p><h1>내 스크립트</h1><p className="page-description">한 문장씩, 나의 영어가 되는 시간.</p></div>
        <button className="primary-btn" onClick={onAddScript}><Icon name="plus" />스크립트 추가</button>
      </div>
      <div className="library-toolbar">
        <span className="library-count">내 서재 <strong>{scripts.length}</strong></span>
        <label className="search-field"><Icon name="search" /><input aria-label="내 스크립트 검색" placeholder="스크립트 검색" value={query} onChange={(event) => onQueryChange(event.target.value)} />{query && <IconButton icon="close" label="검색 지우기" onClick={() => onQueryChange('')} />}</label>
      </div>
      {!!scripts.length && !filtered.length && <div className="empty-state"><Icon name="search" /><h2>검색 결과가 없어요</h2><p>다른 제목으로 검색해 보세요.</p></div>}
      {!scripts.length ? (
        <div className="empty-state"><h2>저장된 스크립트가 없습니다.</h2><p>외우고 싶은 문장을 추가하고, 나에게 맞는 방식으로 학습을 시작해 보세요.</p></div>
      ) : (
        <div className="script-list">
          {filtered.map((script, index) => (
            <button key={script.id} className="script-row" onClick={() => onOpenScript(script.id)}>
              <span className={`script-cover cover-${index % 3}`}><Icon name="book" /></span>
              <span className="script-row-copy"><strong>{script.title}</strong><small>문장 {parseItems(script.rawText).length}개 · 최근 수정 {formatDateTime(script.updatedAt)}</small></span>
              <Icon name="chevron" className="row-arrow" />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
