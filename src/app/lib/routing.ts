import type { RouteTarget, Screen } from '../../shared/model/navigation'

export const parseAppPath = (pathname: string): RouteTarget => {
  const [scriptId = '', mode = '', id = ''] = pathname.split('/').filter(Boolean).map(decodeURIComponent)
  if (!scriptId) return { scriptId: null, screen: 'home' }
  if (scriptId === 'profile') return { scriptId: null, screen: 'profile' }
  if (scriptId === 'community') return { scriptId: null, screen: 'community', communityId: mode || undefined }
  if (mode === 'history') return { scriptId, screen: 'history' }
  if (mode === 'flashcard') return { scriptId, screen: 'flashcard' }
  if (mode === 'dictation') return { scriptId, screen: 'dictation' }
  if (mode === 'result' && id) return { scriptId, screen: 'result', sessionId: id }
  return { scriptId, screen: 'script' }
}

export const pathForScreen = (
  screen: Screen,
  scriptId: string | null,
  sessionId?: string | null,
  communityId?: string | null,
) => {
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
