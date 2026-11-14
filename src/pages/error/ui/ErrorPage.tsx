import { useEffect, useRef } from 'react'
import './error.css'

const messages = {
  403: { title: '이 페이지에 접근할 수 없습니다', description: '접근 권한이 없거나 로그인이 필요한 페이지입니다.' },
  404: { title: '페이지를 찾을 수 없습니다', description: '주소가 잘못되었거나 더 이상 제공되지 않는 페이지입니다.' },
  503: { title: '잠시 연결이 어렵습니다', description: '잠시 후 다시 시도해 주세요.' },
} as const
export function ErrorPage({ code, onHome, onLogin, onRetry }: {
  code: keyof typeof messages; onHome: () => void; onLogin?: () => void; onRetry?: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  const message = messages[code]
  useEffect(() => {
    const oldTitle = document.title
    document.title = `${code} · 몰입 스크립트`
    const robots = document.createElement('meta')
    robots.name = 'robots'; robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    heading.current?.focus()
    return () => { document.title = oldTitle; robots.remove() }
  }, [code])
  return <section className="error-page" aria-labelledby="error-heading">
    <img src="/logo/logo.png" alt="몰입 스터디" className="error-page-logo" />
    <p className="error-page-code">{code}</p>
    <h1 id="error-heading" tabIndex={-1} ref={heading}>{message.title}</h1>
    <p className="error-page-description">{message.description}</p>
    <div className="error-page-actions">
      <button className="primary-btn" onClick={onHome}>홈으로 돌아가기</button>
      {onLogin && <button onClick={onLogin}>로그인</button>}
      {onRetry && <button onClick={onRetry}>다시 시도</button>}
    </div>
    <p className="error-page-footer">Molip Script</p>
  </section>
}
