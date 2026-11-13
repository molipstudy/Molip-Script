import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './app/styles/base.css'
import App from './app/App'
import { MobileIntro } from './app/ui/MobileIntro'
import { InstallAppProvider } from './features/install-app'
import { sanitizeAnalyticsEvent } from './app/lib/analytics'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MobileIntro><InstallAppProvider><App /></InstallAppProvider></MobileIntro>
    <Analytics
      mode={import.meta.env.PROD ? 'production' : 'development'}
      beforeSend={sanitizeAnalyticsEvent}
      debug={false}
    />
  </StrictMode>,
)
