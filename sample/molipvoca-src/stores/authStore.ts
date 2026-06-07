import { create } from 'zustand'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '@/shared/api/supabaseClient'
import { apiRequest } from '@/shared/api/http'
import type { User } from '@/shared/types'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialize: () => Promise<void>
  updateProfile: (data: { username: string; profile_image?: string | null }) => Promise<{ error: string | null }>
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (nextPassword: string) => Promise<{ error: string | null }>
  requestEmailChange: (nextEmail: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

let initialized = false

const syncServerSessionCookie = async () => {
  try {
    await apiRequest('/auth/session', {
      method: 'POST',
      auth: 'required',
      cacheTtlMs: 0,
    })
  } catch {
    // ignore cookie sync failures
  }
}

const clearServerSessionCookie = async () => {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
      auth: 'none',
      cacheTtlMs: 0,
    })
  } catch {
    // ignore cookie clear failures
  }
}

const toKoreanAuthError = (message: string) => {
  const lower = String(message || '').toLowerCase()

  if (lower.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.'
  if (lower.includes('email not confirmed')) return '이메일 인증 후 로그인해 주세요.'
  if (lower.includes('user already registered')) return '이미 가입된 이메일입니다.'
  if (lower.includes('signup is disabled')) return '현재 회원가입이 비활성화되어 있습니다.'
  if (lower.includes('email rate limit exceeded') || lower.includes('too many requests')) return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'
  if (lower.includes('password should be at least')) return '비밀번호는 최소 6자 이상이어야 합니다.'
  if (lower.includes('unable to validate email address')) return '이메일 형식이 올바르지 않습니다.'
  if (lower.includes('same password')) return '기존 비밀번호와 다른 비밀번호를 입력해 주세요.'
  if (lower.includes('new password should be different')) return '기존 비밀번호와 다른 비밀번호를 입력해 주세요.'
  if (lower.includes('for security purposes')) return '보안을 위해 잠시 후 다시 시도해 주세요.'
  if (lower.includes('network') || lower.includes('fetch')) return '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'

  return '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    if (initialized) {
      set({ loading: false })
      return
    }
    initialized = true

    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      try {
        await syncServerSessionCookie()
        const profile = await apiRequest<User>('/auth/me', { auth: 'required' })
        set({ user: profile, session, loading: false })
      } catch {
        set({ user: null, session: null, loading: false })
      }
    } else {
      set({ loading: false })
    }

    supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        try {
          await syncServerSessionCookie()
          const profile = await apiRequest<User>('/auth/me', { auth: 'required' })
          set({ user: profile, session })
        } catch {
          set({ user: null, session: null })
        }
      } else {
        await clearServerSessionCookie()
        set({ user: null, session: null })
      }
    })
  },

  signUp: async (email, password, username) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) {
      return { error: toKoreanAuthError(error.message) }
    }
    return { error: null }
  },

  updateProfile: async (data) => {
    try {
      const payload = {
        username: data.username,
        profile_image: data.profile_image ?? null,
      }
      const profile = await apiRequest<User>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      set({ user: profile })
      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : '프로필 저장에 실패했습니다.' }
    }
  },

  requestPasswordReset: async (email) => {
    const normalized = email.trim()
    if (!normalized) return { error: '이메일을 입력해 주세요.' }

    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, { redirectTo })
    if (error) {
      return { error: toKoreanAuthError(error.message) }
    }
    return { error: null }
  },

  updatePassword: async (nextPassword) => {
    const trimmed = nextPassword.trim()
    if (trimmed.length < 6) return { error: '비밀번호는 6자 이상이어야 합니다.' }

    const { error } = await supabase.auth.updateUser({ password: trimmed })
    if (error) {
      return { error: toKoreanAuthError(error.message) }
    }
    await syncServerSessionCookie()
    return { error: null }
  },

  requestEmailChange: async (nextEmail) => {
    const normalized = nextEmail.trim().toLowerCase()
    if (!normalized) return { error: '변경할 이메일을 입력해 주세요.' }

    const { error } = await supabase.auth.updateUser({ email: normalized })
    if (error) {
      return { error: toKoreanAuthError(error.message) }
    }
    return { error: null }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: toKoreanAuthError(error.message) }
    await syncServerSessionCookie()
    return { error: null }
  },

  signOut: async () => {
    await clearServerSessionCookie()
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
