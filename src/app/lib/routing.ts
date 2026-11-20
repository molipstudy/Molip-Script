import type { RouteTarget, Screen } from '../../shared/model/navigation'

export const parseAppPath = (pathname: string): RouteTarget => {
  const missing: RouteTarget = { scriptId: null, screen: 'not-found' }
  let parts: string[]
  try {
    parts = pathname.split('/').filter(Boolean).map(decodeURIComponent)
  } catch { return missing }
  if (parts.some(part => part.includes('/') || part.includes('\\') || Array.from(part).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))) return missing
  const [scriptId = '', mode = '', id = ''] = parts
  if (!parts.length) return { scriptId: null, screen: 'home' }
  if (scriptId === 'admin' && mode === 'development' && parts.length === 2) return { scriptId: null, screen: 'admin-development' }
  if (scriptId === 'admin' && mode === 'analytics' && parts.length === 2) return { scriptId: null, screen: 'admin-analytics' }
  if (scriptId === 'admin' && mode === 'members' && parts.length === 2) return { scriptId: null, screen: 'admin-members' }
  if (scriptId === 'admin' && mode === 'support' && parts.length === 2) return { scriptId: null, screen: 'admin-support' }
  if (scriptId === 'admin' && mode === 'members' && parts.length === 3 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { scriptId: null, screen: 'admin-members', adminMemberId: id }
  const staticScreens: Record<string, Screen> = { support: 'support', admin: 'admin', continue: 'continue', about: 'about',
    library: 'library', auth: 'auth', profile: 'profile', '404': 'not-found', '403': 'forbidden' }
  if (Object.hasOwn(staticScreens, scriptId)) return parts.length === 1 ? { scriptId: null, screen: staticScreens[scriptId] } : missing
  if (scriptId === 'community') {
    if (mode === 'people') return parts.length === 3 && id ? { scriptId: null, screen: 'publisher', publisherId: id } : missing
    return parts.length <= 2 ? { scriptId: null, screen: 'community', communityId: mode || undefined } : missing
  }
  if (parts.length === 1) return { scriptId, screen: 'script' }
  if (parts.length === 2 && ['masking', 'history', 'flashcard', 'dictation'].includes(mode)) return { scriptId, screen: mode as Screen }
  if (parts.length === 3 && mode === 'result' && id) return { scriptId, screen: 'result', sessionId: id }
  return missing
}

export const pathForScreen = (
  screen: Screen,
  scriptId: string | null,
  sessionId?: string | null,
  communityId?: string | null,
  publisherId?: string | null,
  adminMemberId?: string | null,
) => {
  if (screen === 'support') return '/support'
  if (screen === 'admin-development') return '/admin/development'
  if (screen === 'admin-analytics') return '/admin/analytics'
  if (screen === 'admin-members') return adminMemberId ? `/admin/members/${encodeURIComponent(adminMemberId)}` : '/admin/members'
  if (screen === 'admin-support') return '/admin/support'
  if (screen === 'not-found') return '/404'
  if (screen === 'forbidden') return '/403'
  if (screen === 'admin') return adminMemberId ? `/admin/members/${encodeURIComponent(adminMemberId)}` : '/admin'
  if (screen === 'continue') return '/continue'
  if (screen === 'publisher') return publisherId ? `/community/people/${encodeURIComponent(publisherId)}` : '/community'
  if (screen === 'about') return '/about'
  if (screen === 'library') return '/library'
  if (screen === 'auth') return '/auth'
  if (screen === 'masking' && scriptId) return `/${encodeURIComponent(scriptId)}/masking`
  if (screen === 'profile') return '/profile'
  if (screen === 'community') return communityId ? `/community/${encodeURIComponent(communityId)}` : '/community'
  if (!scriptId) return '/'
  const encodedId = encodeURIComponent(scriptId)
  if (screen === 'history') return `/${encodedId}/history`
  if (screen === 'flashcard') return `/${encodedId}/flashcard`
  if (screen === 'dictation') return `/${encodedId}/dictation`
  if (screen === 'result' && sessionId) return `/${encodedId}/result/${encodeURIComponent(sessionId)}`
  if (screen === 'script') return `/${encodedId}`
  return '/'
}
