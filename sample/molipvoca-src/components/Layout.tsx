import { Link, NavLink, Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/shared/ui/Icon'
import { useViewportMode } from '@/shared/lib/useViewportMode'
import { useAuthStore } from '@/features/auth/model/authStore'

const resolveHeaderTitle = (pathname: string) => {
  const matchedTitles: Array<{ pattern: string; title: string }> = [
    { pattern: '/community', title: '커뮤니티' },
    { pattern: '/voca/:id/edit', title: '단어 추가' },
    { pattern: '/voca/:id/settings', title: '단어장 설정' },
    { pattern: '/voca/:id/collaborate', title: '협업 관리' },
    { pattern: '/voca/:id', title: '단어장' },
    { pattern: '/study/:id/flashcard', title: '플래시카드' },
    { pattern: '/study/:id/multiple_choice', title: '객관식' },
    { pattern: '/study/:id/writing', title: '주관식' },
    { pattern: '/study/:id', title: '학습 시작' },
    { pattern: '/folder/:id', title: '폴더' },
    { pattern: '/shared/:shareToken', title: '공유 단어장' },
    { pattern: '/account', title: '계정 설정' },
    { pattern: '/reset-password', title: '비밀번호 재설정' },
  ]

  for (const item of matchedTitles) {
    if (matchPath({ path: item.pattern, end: true }, pathname)) return item.title
  }

  if (pathname === '/register') return '회원가입'
  if (pathname === '/login') return '로그인'
  if (pathname === '/reset-password') return '비밀번호 재설정'
  return '단어장'
}

const resolvePrimaryTab = (pathname: string) => {
  if (matchPath({ path: '/community/*' }, pathname) || pathname === '/community') return '/community'
  if (matchPath({ path: '/account/*' }, pathname) || pathname === '/account') return '/account'
  return '/'
}

export default function Layout() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { isDesktop } = useViewportMode()

  const isRoot = location.pathname === '/'
  const isTopLevelTabPage =
    location.pathname === '/' || location.pathname === '/community' || location.pathname === '/account'
  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/reset-password'
  const isSharedPage = Boolean(matchPath({ path: '/shared/:shareToken', end: true }, location.pathname))
  const canGoBack = !isTopLevelTabPage && !isAuthPage
  const activePrimaryTab = resolvePrimaryTab(location.pathname)
  const showMobileTabBar = !isSharedPage
  const title = resolveHeaderTitle(location.pathname)

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/')
  }
  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="w-full max-w-[680px] mx-auto min-h-screen bg-bg sm:border-x sm:border-border/70">
          <nav className="bg-surface/95 backdrop-blur border-b border-border sticky top-0 z-50">
            <div className="h-14 grid grid-cols-[48px_1fr_48px] items-center px-1">
              <div className="flex justify-center">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full text-text-secondary hover:text-text hover:bg-bg transition-colors"
                  aria-label="뒤로가기"
                >
                  <Icon name="chevronLeft" size={18} />
                </button>
              </div>
              <h1 className="text-sm font-semibold text-center truncate px-2">{title}</h1>
              <div className="w-9 h-9" />
            </div>
          </nav>
          <main className="px-4 py-6">
            <Outlet />
          </main>
        </div>
      </div>
    )
  }

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="max-w-[1280px] mx-auto px-6 py-6 grid grid-cols-[260px_1fr] gap-6">
          <aside className="sticky top-6 h-[calc(100vh-3rem)] rounded-3xl border border-border bg-surface p-4 flex flex-col">
            <Link to="/" className="inline-flex items-center gap-2 px-2 py-2 no-underline text-text">
              <img src="/logo.png" alt="Molip" className="w-9 h-9 rounded-lg object-cover" />
              <div>
                <p className="text-xs text-text-secondary">Molip</p>
                <p className="font-semibold leading-5">단어장</p>
              </div>
            </Link>

            <nav className="mt-4 space-y-1">
              <NavLink
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                  activePrimaryTab === '/' ? 'bg-primary/10 text-primary font-semibold' : 'text-text-secondary hover:bg-bg'
                }`}
              >
                <Icon name="home" size={15} />
                단어장
              </NavLink>
              <NavLink
                to="/community"
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                  activePrimaryTab === '/community'
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text-secondary hover:bg-bg'
                }`}
              >
                <Icon name="users" size={15} />
                커뮤니티
              </NavLink>
              <NavLink
                to="/account"
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                  activePrimaryTab === '/account'
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text-secondary hover:bg-bg'
                }`}
              >
                <Icon name="settings" size={15} />
                계정 설정
              </NavLink>
            </nav>

            <div className="mt-auto rounded-2xl border border-border p-3">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-full bg-bg border border-border inline-flex items-center justify-center">
                  <Icon name="user" size={15} className="text-text-secondary" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user?.username || '게스트'}</p>
                  <p className="text-xs text-text-secondary truncate">{user?.email || '로그인해서 내 단어장을 관리하세요'}</p>
                </div>
              </div>
              {user ? (
                <button
                  onClick={() => void handleSignOut()}
                  className="w-full mt-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-border text-sm text-text-secondary hover:border-primary transition-colors"
                >
                  <Icon name="logOut" size={14} />
                  로그아웃
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full mt-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  <Icon name="user" size={14} />
                  로그인
                </button>
              )}
            </div>
          </aside>

          <main className="min-w-0">
            {canGoBack && (
              <div className="sticky top-6 z-20 mb-4 bg-surface/95 backdrop-blur rounded-2xl border border-border px-3 py-2.5 inline-flex items-center gap-2">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-text hover:bg-bg transition-colors"
                  aria-label="뒤로가기"
                >
                  <Icon name="chevronLeft" size={17} />
                </button>
                <p className="font-semibold">{title}</p>
              </div>
            )}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="w-full max-w-[680px] mx-auto min-h-screen bg-bg sm:border-x sm:border-border/70">
        <nav className="bg-surface/95 backdrop-blur border-b border-border sticky top-0 z-50">
          <div className="h-14 grid grid-cols-[48px_1fr_48px] items-center px-1">
            <div className="flex justify-center">
              {canGoBack ? (
                <button
                  onClick={handleBack}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full text-text-secondary hover:text-text hover:bg-bg transition-colors"
                  aria-label="뒤로가기"
                >
                  <Icon name="chevronLeft" size={18} />
                </button>
              ) : (
                <div className="w-9 h-9" />
              )}
            </div>

            <div className="flex items-center justify-center">
              {isRoot ? (
                <div className="inline-flex items-center gap-2">
                  <img src="/logo.png" alt="Molip" className="h-8 w-auto" />
                  <span className="text-lg font-bold text-primary tracking-tight">몰입 보카</span>
                </div>
              ) : (
                <h1 className="text-sm font-semibold text-center truncate px-2">{title}</h1>
              )}
            </div>

            <div className="w-9 h-9" />
          </div>
        </nav>

        <main className={`px-4 py-4 ${showMobileTabBar ? 'pb-24' : 'pb-8'}`}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {showMobileTabBar && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[680px] bg-surface/95 backdrop-blur border-t border-border z-[60] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-3 h-16">
            <button
              onClick={() => navigate('/')}
              className={`inline-flex flex-col items-center justify-center gap-1 text-xs ${
                activePrimaryTab === '/' ? 'text-primary font-semibold' : 'text-text-secondary'
              }`}
            >
              <Icon name="home" size={17} />
              단어장
            </button>
            <button
              onClick={() => navigate('/community')}
              className={`inline-flex flex-col items-center justify-center gap-1 text-xs ${
                activePrimaryTab === '/community' ? 'text-primary font-semibold' : 'text-text-secondary'
              }`}
            >
              <Icon name="users" size={17} />
              커뮤니티
            </button>
            <button
              onClick={() => navigate('/account')}
              className={`inline-flex flex-col items-center justify-center gap-1 text-xs ${
                activePrimaryTab === '/account' ? 'text-primary font-semibold' : 'text-text-secondary'
              }`}
            >
              <Icon name="settings" size={17} />
              계정
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}
