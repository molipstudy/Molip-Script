import type { MouseEvent } from 'react'
import { Icon } from '../../../shared/ui'
import type { IconName } from '../../../shared/ui'
import { DashboardWidgets } from './DashboardWidgets'
import { AdminAnalyticsPage } from './AdminAnalyticsPage'
import { AdminDevelopmentPage } from './AdminDevelopmentPage'
import { AdminMembersPage } from './AdminMembersPage'
import { SupportPage } from '../../support/ui/SupportPage'
import './admin.css'

export type AdminSection = 'dashboard' | 'analytics' | 'members' | 'support' | 'development'
const menus: { section: AdminSection; title: string; icon: IconName; href: string }[] = [
  { section: 'analytics', title: '방문 통계', icon: 'chart', href: '/admin/analytics' },
  { section: 'members', title: '회원 관리', icon: 'users', href: '/admin/members' },
  { section: 'development', title: '개발·배포', icon: 'settings', href: '/admin/development' },
  { section: 'support', title: '문의함', icon: 'message', href: '/admin/support' },
]
export function AdminPage({ section = 'dashboard', memberId, onSelectMember, onNavigate }: { section?: AdminSection; memberId: string | null; onSelectMember: (id: string | null) => void; onNavigate: (section: AdminSection) => void }) {
  const follow = (event: MouseEvent<HTMLAnchorElement>, next: AdminSection) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault(); onNavigate(next)
  }
  return <div className="admin-workspace">
    <nav className="admin-section-nav" aria-label="관리자 메뉴"><a href="/admin" aria-current={section === 'dashboard' ? 'page' : undefined} onClick={event => follow(event, 'dashboard')}><Icon name="home" />관리자 홈</a>{menus.map(menu => <a key={menu.section} href={menu.href} aria-current={section === menu.section ? 'page' : undefined} onClick={event => follow(event, menu.section)}><Icon name={menu.icon} />{menu.title}</a>)}</nav>
    {section === 'dashboard' ? <section className="admin-page admin-dashboard"><header className="page-top"><div><p className="eyebrow">Molip Study</p><h1>관리자 대시보드</h1><p className="page-description">회원과 서비스의 최근 현황을 확인하세요.</p></div></header>
      <nav className="admin-service-links admin-dashboard-links" aria-label="외부 서비스 관리 도구">{[['Supabase', 'https://supabase.com/dashboard/project/fdmcqpomrywuobbrmnyl'], ['GitHub', 'https://github.com/molipstudy/Molip-Script'], ['Vercel', 'https://vercel.com/z1hxn/molip-script']].map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label}<Icon name="arrow" /></a>)}</nav>
      <DashboardWidgets />
    </section> : section === 'analytics' ? <AdminAnalyticsPage /> : section === 'members' ? <AdminMembersPage memberId={memberId} onSelectMember={onSelectMember} /> : section === 'development' ? <AdminDevelopmentPage /> : <SupportPage admin />}
  </div>
}
