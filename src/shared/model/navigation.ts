export type Screen =
  | 'home'
  | 'editor'
  | 'script'
  | 'history'
  | 'flashcard'
  | 'dictation'
  | 'result'
  | 'community'
  | 'profile'
  | 'auth'

export type RouteTarget = {
  scriptId: string | null
  screen: Screen
  sessionId?: string
  communityId?: string
}
