import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const INTRO_SEEN_KEY = 'molip-mobile-intro-seen'
const MOBILE_QUERY = '(max-width: 820px)'

function shouldShowIntro() {
  if (!window.matchMedia(MOBILE_QUERY).matches) return false
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) !== '1'
  } catch {
    return true
  }
}

export function MobileIntro({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(shouldShowIntro)

  useEffect(() => {
    if (!visible) return
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1')
    } catch {
      // The intro still works when browser storage is unavailable.
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => setVisible(false), reducedMotion ? 500 : 1400)
    const mobile = window.matchMedia(MOBILE_QUERY)
    const handleResize = () => {
      if (!mobile.matches) setVisible(false)
    }
    mobile.addEventListener('change', handleResize)

    return () => {
      window.clearTimeout(timer)
      mobile.removeEventListener('change', handleResize)
      document.body.style.overflow = previousOverflow
    }
  }, [visible])

  return (
    <>
      <div className="app-entry" inert={visible} aria-hidden={visible || undefined}>{children}</div>
      {visible && (
        <div className="mobile-intro" role="status" aria-label="몰입 스크립트를 시작합니다">
          <div className="mobile-intro-brand" aria-hidden="true">
            <img src="/logo/logo.png" alt="" width="88" height="88" fetchPriority="high" />
            <span>Molip Study</span>
            <strong>몰입 스크립트</strong>
            <p>오늘도, 한 문장 더.</p>
          </div>
        </div>
      )}
    </>
  )
}
