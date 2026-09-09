import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AsyncButton, Icon, IconButton, Modal } from '../../../shared/ui'
import { InstallAppContext } from '../model/context'
import { detectInstallBrowser, installGuides } from '../model/guides'
import type { InstallGuideId } from '../model/guides'
import './install-app.css'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function InstallAppProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(isStandalone)
  const [open, setOpen] = useState(false)
  const [browser] = useState(detectInstallBrowser)
  const [selected, setSelected] = useState<InstallGuideId>(browser.guide)
  const [canInstall, setCanInstall] = useState(false)
  const [notice, setNotice] = useState('')
  const [copyFallback, setCopyFallback] = useState(false)
  const promptRef = useRef<InstallPromptEvent | null>(null)
  const guide = installGuides[selected]
  const appUrl = `${window.location.origin}/`

  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault()
      promptRef.current = event as InstallPromptEvent
      setCanInstall(true)
    }
    const onInstalled = () => {
      promptRef.current = null
      setCanInstall(false)
      setInstalled(true)
      setNotice('추가가 완료됐어요. 홈 화면이나 앱 목록에서 몰입 스크립트를 열어보세요.')
    }
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const onDisplayChange = () => setInstalled(isStandalone())
    window.addEventListener('beforeinstallprompt', beforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    displayMode.addEventListener('change', onDisplayChange)
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      displayMode.removeEventListener('change', onDisplayChange)
    }
  }, [])

  const install = async () => {
    const event = promptRef.current
    if (!event) return
    promptRef.current = null
    setCanInstall(false)
    try {
      await event.prompt()
      const choice = await event.userChoice
      setNotice(choice.outcome === 'accepted'
        ? '설치를 요청했어요. 브라우저에서 설치가 끝나면 앱을 열어보세요.'
        : '나중에 추가해도 괜찮아요. 아래 안내로 언제든 다시 진행할 수 있어요.')
    } catch {
      setNotice('설치 창을 열지 못했어요. 아래 브라우저 메뉴 안내로 추가해 주세요.')
    }
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(appUrl)
      setNotice('주소를 복사했어요. Safari나 Chrome 주소창에 붙여넣어 주세요.')
    } catch {
      setCopyFallback(true)
      setNotice('아래 주소를 길게 누르거나 선택해서 복사해 주세요.')
    }
  }

  return (
    <InstallAppContext.Provider value={{ installed, openGuide: () => { setNotice(''); setCopyFallback(false); setOpen(true) } }}>
      {children}
      {open && (
        <Modal label="앱으로 추가하기" onClose={() => setOpen(false)}>
          <section className="install-dialog" onKeyDown={(event) => event.stopPropagation()}>
            <IconButton className="install-close" icon="close" label="설치 안내 닫기" onClick={() => setOpen(false)} />
            <div className="install-hero">
              <div className="install-app-preview" aria-hidden="true"><img src="/logo/logo.png" alt="" /><span className="install-preview-badge"><Icon name="plus" /></span></div>
              <p className="eyebrow">YOUR DAILY ENGLISH</p>
              <h2>한 번의 터치로,<br />몰입을 시작해요.</h2>
              <p>몰입 스크립트를 앱으로 추가하고<br />홈 화면에서 바로 학습하세요.</p>
              <div className="install-benefits"><span><Icon name="check" />홈 화면 바로 실행</span><span><Icon name="check" />나만의 학습 공간</span></div>
            </div>
            <div className="install-guide-body">
              {installed ? <div className="install-success"><Icon name="check" /><h3>앱이 추가됐어요</h3><p>홈 화면이나 앱 목록에서 몰입 스크립트를 찾아보세요.</p></div> : <>
                {browser.embedded && <div className="install-browser-note"><strong>Safari나 Chrome에서 열어 주세요</strong><p>앱 안의 브라우저에서는 설치 메뉴가 없을 수 있어요. 메뉴에서 ‘다른 브라우저로 열기’를 선택하거나 아래에서 주소를 복사해 주세요.</p></div>}
                {canInstall && !browser.embedded && <AsyncButton className="primary-btn install-now" onAction={install}><Icon name="install" />지금 앱으로 설치</AsyncButton>}
                <div className="install-guide-label"><h3>브라우저별 추가 방법</h3><span>간단한 3단계</span></div>
                <div className="install-browser-options" role="group" aria-label="설치 안내 브라우저 선택">
                  {Object.entries(installGuides).map(([id, item]) => <button key={id} type="button" aria-pressed={selected === id} className={selected === id ? 'active' : ''} onClick={() => setSelected(id as InstallGuideId)}><strong>{item.label}</strong><small>{item.device}</small></button>)}
                </div>
                <ol className="install-steps" aria-label={`${guide.device} ${guide.label} 추가 방법`}>
                  {guide.steps.map(([title, description], index) => <li key={`${selected}-${index}`}><span className="install-step-number" aria-hidden="true">{index + 1}</span><div><h4>{title}</h4><p>{description}</p></div></li>)}
                </ol>
                <p className="install-footnote">기기와 브라우저 버전에 따라 메뉴 이름이 조금 다를 수 있어요. <a href={guide.source} target="_blank" rel="noreferrer">공식 도움말 <span aria-hidden="true">↗</span></a></p>
              </>}
              <p className="install-notice" role="status">{notice}</p>
              {copyFallback && <input className="install-copy-url" aria-label="복사할 사이트 주소" readOnly value={appUrl} onFocus={(event) => event.currentTarget.select()} />}
            </div>
            <footer className="install-footer"><AsyncButton onAction={copyAddress}><Icon name="copy" />주소 복사</AsyncButton><button className="primary-btn" onClick={() => setOpen(false)}>확인했어요<Icon name="check" /></button></footer>
          </section>
        </Modal>
      )}
    </InstallAppContext.Provider>
  )
}
