import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import { localAdminAnalytics } from './scripts/dev/admin-analytics.mjs'
import react from '@vitejs/plugin-react'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), localAdminAnalytics(loadEnv(mode, process.cwd(), ''))],
  define: { __APP_VERSION__: JSON.stringify(version) },
}))
