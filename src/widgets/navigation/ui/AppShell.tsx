import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Screen } from '../../../shared/model/navigation'
import { BRAND_LINKS } from '../../../shared/config'
import { displayLoginId } from '../../../shared/lib'
import { AsyncButton, Icon } from '../../../shared/ui'
import { ProjectCredit } from '../../project-credit'
import { InstallAppButton } from '../../../features/install-app'

type MainScreen = 'admin' | 'continue' | 'about' | 'auth' | 'home' | 'library' | 'community' | 'profile'

type AppShellProps = {
  isAdmin?: boolean
  storyPage?: boolean
  screen: Screen
  user: User | null
  syncError: string
  mobileHeader?: ReactNode
  studyDialog?: ReactNode
  children: ReactNode
  onNavigate: (screen: MainScreen) => Promise<unknown>
  onOpenCommunity: () => void
  onSignOut: () => Promise<unknown>
}

export function AppShell({
  screen,
  storyPage = false,
  isAdmin = false,
  user,
  syncError,
  mobileHeader,
  studyDialog,
  children,
  onNavigate,
  onOpenCommunity,
  onSignOut,
}: AppShellProps) {
  const loginId = user ? displayLoginId(user) : ''
  const libraryActive = ['library', 'script', 'history', 'result', 'flashcard', 'dictation', 'masking'].includes(screen)

  return (
    <div className={`app-layout ${mobileHeader ? 'mobile-detail-layout' : ''}`}>
      <aside className="sidebar">
        <button className="brand-button" onClick={() => void onNavigate('home')}>
          <img src="/logo/logo.png" alt="몰입 스터디" />
          <span><small>Molip Study</small>몰입 스크립트</span>
        </button>
        <nav className="sidebar-nav">
          <button className={screen === 'home' ? 'active' : ''} onClick={() => void onNavigate('home')}><Icon name="home" />홈</button>
          <button className={libraryActive ? 'active' : ''} onClick={() => void onNavigate('library')}><Icon name="book" />내 스크립트</button>
          <button className={(screen === 'community' || screen === 'publisher') ? 'active' : ''} onClick={onOpenCommunity}><Icon name="users" />커뮤니티</button>
          {isAdmin && <button className={screen === 'admin' ? 'active' : ''} onClick={() => void onNavigate('admin')}><Icon name="settings" />관리자</button>}
        </nav>
        <InstallAppButton compact />
        <div className="sidebar-services">
        <details className="brand-links">
          <summary>몰입 스터디 서비스</summary>
          {BRAND_LINKS.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}
        </details>
          {user && <button className="text-btn service-about-link" onClick={() => void onNavigate('about')}>서비스 소개</button>}
        </div>
        <div className="sidebar-credit">
          <ProjectCredit />
        </div>
        <div className="account-box">
          {user ? <button className={`account-profile ${(screen === 'profile' || screen === 'admin') ? 'active' : ''}`} aria-current={(screen === 'profile' || screen === 'admin') ? 'page' : undefined} onClick={() => void onNavigate('profile')}>
            <span className="avatar">{loginId.slice(0, 1).toUpperCase()}</span>
            <span className="account-copy"><strong>{loginId}</strong><small>오늘도, 한 문장 더.</small></span>
            <Icon name="chevron" />
          </button> : <button className="primary-btn account-login" onClick={() => void onNavigate('auth')}><Icon name="profile" />로그인</button>}
          {user && <AsyncButton className="account-logout" onAction={onSignOut}><Icon name="logout" />로그아웃</AsyncButton>}
        </div>
      </aside>

      <main className={`workspace ${screen === 'flashcard' || screen === 'dictation' || screen === 'masking' ? 'focus-workspace' : ''} ${storyPage ? 'story-workspace' : ''}`}>
        <header className="mobile-header">
          {mobileHeader ?? <button className="brand-button" onClick={() => void onNavigate('home')}>
            <img src="/logo/logo.png" alt="몰입 스터디" /><span>몰입 스크립트</span>
          </button>}
        </header>
        {syncError && <p className="sync-error">{syncError}</p>}
        <div className="screen-content" key={screen}>{children}</div>
        {studyDialog}
      </main>

      <nav className="bottom-nav" aria-label="모바일 주요 메뉴">
        <AsyncButton className={screen === 'home' ? 'active' : ''} onAction={() => onNavigate('home')}><Icon name="home" /><span>홈</span></AsyncButton>
        <AsyncButton className={libraryActive ? 'active' : ''} aria-current={libraryActive ? 'page' : undefined} onAction={() => onNavigate('library')}><Icon name="book" /><span>내 스크립트</span></AsyncButton>
        <AsyncButton className={(screen === 'community' || screen === 'publisher') ? 'active' : ''} aria-current={(screen === 'community' || screen === 'publisher') ? 'page' : undefined} onAction={() => onNavigate('community')}><Icon name="users" /><span>커뮤니티</span></AsyncButton>
        <AsyncButton className={(screen === 'profile' || screen === 'admin') ? 'active' : ''} aria-current={(screen === 'profile' || screen === 'admin') ? 'page' : undefined} onAction={() => onNavigate('profile')}><Icon name="profile" /><span>내 정보</span></AsyncButton>
      </nav>
    </div>
  )
}
