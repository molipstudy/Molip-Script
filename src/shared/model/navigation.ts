export type Screen =
  | 'home'
  | 'about'
  | 'library'
  | 'masking'
  | 'editor'
  | 'script'
  | 'history'
  | 'flashcard'
  | 'dictation'
  | 'result'
  | 'community'
  | 'publisher'
  | 'continue'
  | 'profile'
  | 'auth'

export type RouteTarget = {
  scriptId: string | null
  screen: Screen
  sessionId?: string
  publisherId?: string
  communityId?: string
}
