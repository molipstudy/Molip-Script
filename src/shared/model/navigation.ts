export type Screen =
  | 'not-found'
  | 'forbidden'
  | 'support'
  | 'admin-support'
  | 'admin'
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
  adminMemberId?: string
  publisherId?: string
  communityId?: string
}
