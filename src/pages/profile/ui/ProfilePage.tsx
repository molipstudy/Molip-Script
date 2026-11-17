import { useState } from 'react'
import { ProfileEditor } from '../../../features/account-profile/ui/ProfileEditor'
import type { AccountProfile } from '../../../features/account-profile/model/profile'
import type { User } from '@supabase/supabase-js'
import type { LearningStore } from '../../../entities/learning'
import { APP_VERSION, BRAND_LINKS } from '../../../shared/config'
import { displayLoginId } from '../../../shared/lib'
import { AsyncButton, Icon } from '../../../shared/ui'
import { ProjectCredit } from '../../../widgets/project-credit'
import { InstallAppButton } from '../../../features/install-app'

export function ProfilePage({ user, store, onSignOut, onAbout, onAdmin, profile, profileError, onProfileSaved, onRetry }: { user: User; store: LearningStore; onSignOut: () => Promise<unknown>; onAbout: () => void; onAdmin?: () => void; profile: AccountProfile | null; profileError: string; onProfileSaved: (profile: AccountProfile) => void; onRetry: () => void }) {
  const loginId = profile?.username || displayLoginId(user)
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')
  return (
    <section className="profile-page">
      <div className="page-top"><div><p className="eyebrow">My account</p><h1>내 정보</h1><p className="page-description">나의 학습 공간을 관리해요.</p></div></div>
      <section className="profile-card"><span className="avatar">{loginId.slice(0, 1).toUpperCase()}</span><div><h2>{loginId}</h2><p>{user.email}</p><span className="count-badge">Molip Study</span></div></section>
      <section className="body-panel profile-personal"><div className="profile-personal-head"><h2>회원 정보</h2>{profile && !editing && <button onClick={() => { setEditing(true); setNotice('') }}><Icon name="edit" />정보 편집</button>}</div>
        {profileError ? <><p role="alert">{profileError}</p><button onClick={onRetry}>다시 시도</button></> : !profile ? <p role="status">회원 정보를 불러오는 중…</p> : editing ? <ProfileEditor key={profile.id} profile={profile} onSaved={value => { onProfileSaved(value); setEditing(false); setNotice('회원 정보를 저장했습니다.') }} onCancel={() => setEditing(false)} /> : <dl className="profile-personal-list"><div><dt>유저네임</dt><dd>{profile.username}</dd></div><div><dt>이름</dt><dd>{profile.full_name || '미입력'}</dd></div><div><dt>전화번호</dt><dd>{profile.phone_number || '미입력'}</dd></div></dl>}
        {notice && <p role="status">{notice}</p>}
      </section>
      <section className="profile-stats" aria-label="내 학습 기록">
        <article><Icon name="book" /><strong>{store.scripts.length}</strong><span>내 스크립트</span></article>
        <article><Icon name="history" /><strong>{store.dictationSessions.length + store.flashcardSessions.length}</strong><span>완료한 학습</span></article>
        <article><Icon name="pen" /><strong>{store.activeQuizzes.length}</strong><span>진행 중인 학습</span></article>
      </section>
      {onAdmin && <button className="profile-admin-link" onClick={onAdmin}><Icon name="settings" /><span>관리자 페이지</span><Icon name="chevron" /></button>}
      <InstallAppButton />
      <section className="body-panel profile-services"><h2>몰입 스터디</h2>{BRAND_LINKS.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer"><span>{link.label}</span><Icon name="arrow" /></a>)}</section>
      <AsyncButton className="profile-logout" onAction={onSignOut}><Icon name="logout" />로그아웃</AsyncButton>
      <ProjectCredit />
      <button className="text-btn profile-about" onClick={onAbout}>서비스 소개 다시 보기<Icon name="arrow" /></button>
      <p className="app-version">Molip Script · <span>v{APP_VERSION}</span></p>
    </section>
  )
}
