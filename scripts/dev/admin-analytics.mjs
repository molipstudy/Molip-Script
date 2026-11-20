import { handleDevelopment } from '../../api/admin-development.js'
import { handleAnalytics } from '../../api/admin-analytics.js'

// Node-only development middleware. Reuse the production authorization checks;
// credentials stay in the Vite server process and never enter import.meta.env.
export function localAdminAnalytics(env, handler = handleAnalytics) {
  return {
    name: 'local-admin-analytics',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost')
        const route = url.pathname === '/api/admin-analytics' ? handler : url.pathname === '/api/admin-development' ? handleDevelopment : null
        if (!route) return next()
        const response = {
          setHeader: (name, value) => res.setHeader(name, value),
          status(code) { res.statusCode = code; return response },
          json(body) { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(body)); return response },
        }
        try {
          await route({ method: req.method, headers: req.headers, query: Object.fromEntries(url.searchParams) }, response, { env })
        } catch {
          if (!res.writableEnded) response.status(503).json({ error: '로컬 관리자 서버에 연결하지 못했어요.' })
        }
      })
    },
  }
}
