import type { User } from '@supabase/supabase-js'
import type { LearningStore } from '../../../entities/learning'
import { APP_VERSION, BRAND_LINKS } from '../../../shared/config'
import { displayLoginId } from '../../../shared/lib'
import { AsyncButton, Icon } from '../../../shared/ui'
import { ProjectCredit } from '../../../widgets/project-credit'
import { InstallAppButton } from '../../../features/install-app'

export function ProfilePage({ user, store, onSignOut, onAbout }: { user: User; store: LearningStore; onSignOut: () => Promise<unknown>; onAbout: () => void }) {
  const loginId = displayLoginId(user)
  return (
    <section className="profile-page">
      <div className="page-top"><div><p className="eyebrow">My account</p><h1>내 정보</h1><p className="page-description">나의 학습 공간을 관리해요.</p></div></div>
      <section className="profile-card"><span className="avatar">{loginId.slice(0, 1).toUpperCase()}</span><div><h2>{loginId}</h2><p>{user.email}</p><span className="count-badge">Molip Study</span></div></section>
      <section className="profile-stats" aria-label="내 학습 기록">
        <article><Icon name="book" /><strong>{store.scripts.length}</strong><span>내 스크립트</span></article>
        <article><Icon name="history" /><strong>{store.dictationSessions.length + store.flashcardSessions.length}</strong><span>완료한 학습</span></article>
        <article><Icon name="pen" /><strong>{store.activeQuizzes.length}</strong><span>진행 중인 학습</span></article>
      </section>
      <InstallAppButton />
      <section className="body-panel profile-services"><h2>몰입 스터디</h2>{BRAND_LINKS.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer"><span>{link.label}</span><Icon name="arrow" /></a>)}</section>
      <AsyncButton className="profile-logout" onAction={onSignOut}><Icon name="logout" />로그아웃</AsyncButton>
      <ProjectCredit />
      <button className="text-btn profile-about" onClick={onAbout}>서비스 소개 다시 보기<Icon name="arrow" /></button>
      <p className="app-version">Molip Script · <span>v{APP_VERSION}</span></p>
    </section>
  )
}
