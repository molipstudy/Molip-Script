import { supabase } from '@/shared/api/supabaseClient'

type AuthMode = 'required' | 'optional' | 'none'
type CacheEntry = {
  expiresAt: number
  value: unknown
}

interface ApiRequestOptions extends RequestInit {
  auth?: AuthMode
  cacheTtlMs?: number
}

const resolveApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  if (configured) return configured.replace(/\/+$/, '')

  if (import.meta.env.DEV) {
    return 'http://localhost:4000/api'
  }

  return '/api'
}

const API_BASE_URL = resolveApiBaseUrl()
const DEFAULT_GET_CACHE_TTL_MS = 8000
const responseCache = new Map<string, CacheEntry>()
const inflightGetRequests = new Map<string, Promise<unknown>>()

const cloneResponse = <T,>(value: T): T => {
  if (typeof value !== 'object' || value === null) return value
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

const buildCacheKey = (method: string, path: string, token: string | null) => {
  const tokenKey = token || 'guest'
  return `${method}:${path}:${tokenKey}`
}

const clearGetCache = () => {
  responseCache.clear()
  inflightGetRequests.clear()
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = 'required', cacheTtlMs = DEFAULT_GET_CACHE_TTL_MS, headers, ...rest } = options
  const method = String(rest.method || 'GET').toUpperCase()
  const isGetRequest = method === 'GET'

  let token: string | null = null
  if (auth !== 'none') {
    const { data } = await supabase.auth.getSession()
    token = data.session?.access_token || null
  }

  const cacheKey = isGetRequest ? buildCacheKey(method, path, token) : null
  const now = Date.now()

  if (isGetRequest && cacheKey && cacheTtlMs > 0) {
    const cached = responseCache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      return cloneResponse(cached.value as T)
    }

    const inflight = inflightGetRequests.get(cacheKey)
    if (inflight) {
      return cloneResponse(await inflight as T)
    }
  }

  const requestPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    })

    if (!response.ok) {
      let message = '요청에 실패했습니다.'
      try {
        const body = await response.json()
        if (body?.message) message = body.message
      } catch {
        // ignore
      }
      throw new Error(message)
    }

    const data = response.status === 204
      ? null as T
      : await response.json() as T

    if (isGetRequest && cacheKey && cacheTtlMs > 0) {
      responseCache.set(cacheKey, {
        value: data,
        expiresAt: Date.now() + cacheTtlMs,
      })
    }

    if (!isGetRequest) {
      clearGetCache()
    }

    return data
  })()

  if (isGetRequest && cacheKey && cacheTtlMs > 0) {
    inflightGetRequests.set(cacheKey, requestPromise as Promise<unknown>)
    try {
      return cloneResponse(await requestPromise)
    } finally {
      inflightGetRequests.delete(cacheKey)
    }
  }

  return requestPromise
}
