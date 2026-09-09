import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/styles/base.css'
import App from './app/App'
import { MobileIntro } from './app/ui/MobileIntro'
import { InstallAppProvider } from './features/install-app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MobileIntro><InstallAppProvider><App /></InstallAppProvider></MobileIntro>
  </StrictMode>,
)
