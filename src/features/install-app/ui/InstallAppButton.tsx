import { Icon } from '../../../shared/ui'
import { useInstallApp } from '../model/context'

export function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const { installed, openGuide } = useInstallApp()
  if (installed) return null
  return (
    <button type="button" className={`install-entry ${compact ? 'compact' : ''}`} onClick={openGuide}>
      <span className="install-entry-icon"><Icon name="install" /></span>
      <span><strong>앱으로 추가</strong>{!compact && <small>홈 화면에서 바로, 오늘의 한 문장.</small>}</span>
      <Icon name="chevron" />
    </button>
  )
}
