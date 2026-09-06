import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Screen } from '../../../shared/model/navigation'
import { BRAND_LINKS } from '../../../shared/config'
import { displayLoginId } from '../../../shared/lib'
import { AsyncButton, Icon } from '../../../shared/ui'
import { ProjectCredit } from '../../project-credit'

type MainScreen = 'home' | 'community' | 'profile'

type AppShellProps = {
  screen: Screen
  user: User
  syncError: string
  studyDialog?: ReactNode
  children: ReactNode
  onNavigate: (screen: MainScreen) => Promise<unknown>
  onAddScript: () => void
  onOpenCommunity: () => void
  onSignOut: () => Promise<unknown>
}

export function AppShell({
  screen,
  user,
  syncError,
  studyDialog,
  children,
  onNavigate,
  onAddScript,
  onOpenCommunity,
  onSignOut,
}: AppShellProps) {
  const loginId = displayLoginId(user)
  const libraryActive = ['home', 'script', 'history', 'result', 'flashcard', 'dictation'].includes(screen)

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <button className="brand-button" onClick={() => void onNavigate('home')}>
          <img src="/logo/logo.png" alt="몰입 스터디" />
          <span><small>Molip Study</small>몰입 스크립트</span>
        </button>
        <nav className="sidebar-nav">
          <button className={libraryActive ? 'active' : ''} onClick={() => void onNavigate('home')}><Icon name="home" />내 스크립트</button>
          <button onClick={onAddScript}><Icon name="plus" />스크립트 추가</button>
          <button className={screen === 'community' ? 'active' : ''} onClick={onOpenCommunity}><Icon name="users" />커뮤니티</button>
        </nav>
        <details className="brand-links">
          <summary>몰입 스터디 서비스</summary>
          {BRAND_LINKS.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}
        </details>
        <ProjectCredit />
        <div className="account-box">
          <button className={`account-profile ${screen === 'profile' ? 'active' : ''}`} aria-current={screen === 'profile' ? 'page' : undefined} onClick={() => void onNavigate('profile')}>
            <span className="avatar">{loginId.slice(0, 1).toUpperCase()}</span>
            <span className="account-copy"><strong>{loginId}</strong><small>오늘도, 한 문장 더.</small></span>
            <Icon name="chevron" />
          </button>
          <AsyncButton className="account-logout" onAction={onSignOut}><Icon name="logout" />로그아웃</AsyncButton>
        </div>
      </aside>

      <main className={`workspace ${screen === 'flashcard' || screen === 'dictation' ? 'focus-workspace' : ''}`}>
        <header className="mobile-header">
          <button className="brand-button" onClick={() => void onNavigate('home')}>
            <img src="/logo/logo.png" alt="몰입 스터디" /><span>몰입 스크립트</span>
          </button>
        </header>
        {syncError && <p className="sync-error">{syncError}</p>}
        <div className="screen-content" key={screen}>{children}</div>
        {studyDialog}
      </main>

      <nav className="bottom-nav" aria-label="모바일 주요 메뉴">
        <AsyncButton className={!['community', 'profile'].includes(screen) ? 'active' : ''} aria-current={!['community', 'profile'].includes(screen) ? 'page' : undefined} onAction={() => onNavigate('home')}><Icon name="book" /><span>내 스크립트</span></AsyncButton>
        <AsyncButton className={screen === 'community' ? 'active' : ''} aria-current={screen === 'community' ? 'page' : undefined} onAction={() => onNavigate('community')}><Icon name="users" /><span>커뮤니티</span></AsyncButton>
        <AsyncButton className={screen === 'profile' ? 'active' : ''} aria-current={screen === 'profile' ? 'page' : undefined} onAction={() => onNavigate('profile')}><Icon name="profile" /><span>내 정보</span></AsyncButton>
      </nav>
    </div>
  )
}
