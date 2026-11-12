import type { User } from '@supabase/supabase-js'

export const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
export const nowIso = () => new Date().toISOString()
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
export const normalizeLoginId = (value: string) => value.trim().toLowerCase()
export const sessionDetailStorageKey = (sessionId: string) => `molip-script:dictation-detail:${sessionId}`
export const isValidLoginId = (value: string) => /^[a-z0-9][a-z0-9._-]{2,31}$/.test(value)

export const displayLoginId = (user: User) => {
  const metadataId = user.user_metadata?.login_id
  if (typeof metadataId === 'string' && metadataId) return metadataId
  return user.email ?? '사용자'
}

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

export const formatPercent = (value: number) => `${Math.round(value)}%`

export const studyModeLabel = (mode: string) => {
  if (mode === 'weak') return '취약 문장'
  if (mode === 'starred') return '별표 문장'
  if (mode === 'range') return '지정 범위'
  return '전체 문장'
}

export const dictationModeLabel = (mode: string) => `${studyModeLabel(mode)} 받아쓰기`

export const errorMessageOf = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return '알 수 없는 오류'
}

export const toFriendlyDbError = (message: string) => {
  const lowered = message.toLowerCase()
  if (lowered.includes('invalid login credentials')) {
    return '아이디 또는 비밀번호가 올바르지 않습니다.'
  }
  if (lowered.includes('email not confirmed')) {
    return '이메일 인증을 완료한 뒤 다시 로그인해 주세요.'
  }
  if (lowered.includes('rate limit') || lowered.includes('too many requests')) {
    return '요청이 많습니다. 잠시 후 다시 시도해 주세요.'
  }
  if (lowered.includes('user already registered') || lowered.includes('user already exists')) {
    return '이미 가입된 이메일입니다. 기존 비밀번호가 맞으면 입력한 아이디로 계정을 연결합니다.'
  }
  if (lowered.includes('profiles_login_id_format') || lowered.includes('duplicate key')) {
    return '이미 사용 중인 아이디이거나 아이디 형식이 올바르지 않습니다.'
  }
  return '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'
}
