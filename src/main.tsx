import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/styles/base.css'
import App from './app/App'
import { MobileIntro } from './app/ui/MobileIntro'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MobileIntro><App /></MobileIntro>
  </StrictMode>,
)
