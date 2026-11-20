import type { MouseEvent } from 'react'
import { Icon } from '../../../shared/ui'
import type { IconName } from '../../../shared/ui'
import { DashboardWidgets } from './DashboardWidgets'
import { AdminAnalyticsPage } from './AdminAnalyticsPage'
import { AdminMembersPage } from './AdminMembersPage'
import { SupportPage } from '../../support/ui/SupportPage'
import './admin.css'

export type AdminSection = 'dashboard' | 'analytics' | 'members' | 'support'
const menus: { section: AdminSection; title: string; description: string; icon: IconName; href: string }[] = [
  { section: 'analytics', title: '방문 통계', description: '방문자, 인기 페이지와 신규 가입 추이를 확인하세요.', icon: 'chart', href: '/admin/analytics' },
  { section: 'members', title: '회원 관리', description: '회원 정보와 스크립트, 학습 현황을 관리하세요.', icon: 'users', href: '/admin/members' },
  { section: 'support', title: '문의함', description: '회원의 문의를 확인하고 답변하세요.', icon: 'message', href: '/admin/support' },
]
export function AdminPage({ section = 'dashboard', memberId, onSelectMember, onNavigate }: { section?: AdminSection; memberId: string | null; onSelectMember: (id: string | null) => void; onNavigate: (section: AdminSection) => void }) {
  const follow = (event: MouseEvent<HTMLAnchorElement>, next: AdminSection) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault(); onNavigate(next)
  }
  return <div className="admin-workspace">
    <nav className="admin-section-nav" aria-label="관리자 메뉴"><a href="/admin" aria-current={section === 'dashboard' ? 'page' : undefined} onClick={event => follow(event, 'dashboard')}><Icon name="home" />관리자 홈</a>{menus.map(menu => <a key={menu.section} href={menu.href} aria-current={section === menu.section ? 'page' : undefined} onClick={event => follow(event, menu.section)}><Icon name={menu.icon} />{menu.title}</a>)}</nav>
    {section === 'dashboard' ? <section className="admin-page admin-dashboard"><header className="page-top"><div><p className="eyebrow">Molip Study</p><h1>관리자 대시보드</h1><p className="page-description">필요한 메뉴를 선택해 서비스 현황을 관리하세요.</p></div></header>
      <div className="admin-menu-grid">{menus.map((menu, index) => <a className="admin-menu-card" href={menu.href} key={menu.section} onClick={event => follow(event, menu.section)}><span className="admin-menu-icon"><Icon name={menu.icon} /></span><span className="admin-menu-number">0{index + 1}</span><h2>{menu.title}</h2><p>{menu.description}</p><span className="admin-menu-open">바로가기<Icon name="arrow" /></span></a>)}</div>
      <DashboardWidgets />
      <section className="admin-external"><h2>서비스 관리 도구</h2><nav className="admin-service-links" aria-label="외부 서비스 관리 도구">{[['Vercel', 'https://vercel.com/z1hxn/molip-script'], ['GitHub', 'https://github.com/molipstudy/Molip-Script'], ['Supabase', 'https://supabase.com/dashboard/project/fdmcqpomrywuobbrmnyl']].map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label}<Icon name="arrow" /></a>)}</nav></section>
    </section> : section === 'analytics' ? <AdminAnalyticsPage /> : section === 'members' ? <AdminMembersPage memberId={memberId} onSelectMember={onSelectMember} /> : <SupportPage admin />}
  </div>
}
