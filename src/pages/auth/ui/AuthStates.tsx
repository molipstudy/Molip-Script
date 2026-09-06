import { LoadingSkeleton } from '../../../shared/ui'

export function SupabaseSetupPage() {
  return (
    <main className="center-page">
      <section className="auth-card">
        <img src="/logo/logo.png" alt="몰입 스터디" className="auth-logo" />
        <h1>Supabase 연결 필요</h1>
        <p className="muted">`.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 설정해 주세요.</p>
      </section>
    </main>
  )
}

export function AppLoadingPage({ view }: { view: string }) {
  return (
    <main className="loading-screen">
      <aside className="loading-sidebar" aria-hidden="true">
        <div className="loading-brand"><img src="/logo/logo.png" alt="" /><span /></div>
        <div className="loading-nav-line wide" />
        <div className="loading-nav-line" />
        <div className="loading-nav-line short" />
        <div className="loading-account" />
      </aside>
      <div className="loading-workspace"><LoadingSkeleton view={view} /></div>
    </main>
  )
}
