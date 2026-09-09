import { useState } from 'react'
import { Icon, IconButton } from '../../../shared/ui'
import { useInstallApp } from '../model/context'

const DISMISSED_KEY = 'molip-install-banner-dismissed'

export function InstallAppBanner() {
  const { installed, openGuide } = useInstallApp()
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISSED_KEY) === '1' } catch { return false }
  })
  if (installed || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try { sessionStorage.setItem(DISMISSED_KEY, '1') } catch { /* Dismiss for this visit without storage. */ }
  }

  return (
    <aside className="install-home-banner" aria-label="몰입 스크립트 앱 추가 안내">
      <IconButton className="install-banner-close" icon="close" label="앱 추가 배너 닫기" onClick={dismiss} />
      <div className="install-banner-copy">
        <span className="install-banner-eyebrow">몰입을 더 가까이</span>
        <h2>홈 화면에서<br />바로 시작해요.</h2>
        <p>앱으로 추가하고, 오늘도 한 문장 더.</p>
        <button className="install-banner-cta" onClick={openGuide}><Icon name="install" />앱으로 추가<Icon name="arrow" /></button>
      </div>
      <div className="install-banner-art" aria-hidden="true"><img src="/logo/logo.png" alt="" /><span>몰입 스크립트</span></div>
    </aside>
  )
}
