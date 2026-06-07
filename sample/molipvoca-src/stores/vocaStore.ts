import { create } from 'zustand'
import { apiRequest } from '@/shared/api/http'
import type { Folder, VocaCollaborator, VocaSet, Word } from '@/shared/types'
import { normalizeMeaningText } from '@/shared/lib/meaning'

type CollaboratorRole = 'editor' | 'viewer'
type AccessRole = 'owner' | CollaboratorRole
type WordInsert = Omit<Word, 'id' | 'created_at'>
type ApiRoleResponse = { role: AccessRole | null }

const normalizeShareScope = (voca: Pick<Partial<VocaSet>, 'share_scope' | 'is_public'>) => {
  if (voca.share_scope === 'private' || voca.share_scope === 'unlisted' || voca.share_scope === 'public') {
    return voca.share_scope
  }
  return voca.is_public ? 'public' : 'private'
}

const normalizeVocaSet = (voca: VocaSet): VocaSet => {
  const shareScope = normalizeShareScope(voca)
  return {
    ...voca,
    share_scope: shareScope,
    is_public: shareScope !== 'private',
  }
}

interface VocaState {
  folders: Folder[]
  vocaSets: VocaSet[]
  communityVocaSets: VocaSet[]
  currentVoca: VocaSet | null
  words: Word[]
  collaborators: VocaCollaborator[]
  loading: boolean

  fetchFolders: () => Promise<void>
  createFolder: (name: string) => Promise<void>
  updateFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>

  fetchVocaSets: (folderId?: string) => Promise<VocaSet[]>
  fetchCommunityVocaSets: () => Promise<VocaSet[]>
  fetchVocaSet: (id: string) => Promise<void>
  fetchSharedVocaByToken: (shareToken: string) => Promise<VocaSet | null>
  fetchMyRole: (vocaId: string) => Promise<AccessRole | null>
  createVocaSet: (data: Partial<VocaSet>) => Promise<string | null>
  updateVocaSet: (id: string, data: Partial<VocaSet>) => Promise<void>
  deleteVocaSet: (id: string) => Promise<void>
  cloneVocaSet: (id: string) => Promise<string | null>

  fetchWords: (vocaId: string) => Promise<void>
  addWord: (word: Omit<Word, 'id' | 'created_at'>) => Promise<void>
  addWordsBulk: (vocaId: string, words: Array<Pick<WordInsert, 'word' | 'meaning' | 'pos' | 'example'>>) => Promise<number>
  updateWord: (id: string, data: Partial<Word>) => Promise<void>
  deleteWord: (id: string) => Promise<void>
  importCSV: (vocaId: string, csvText: string) => Promise<{ success: number; errors: number }>

  fetchCollaborators: (vocaId: string) => Promise<void>
  inviteCollaborator: (vocaId: string, email: string, role: CollaboratorRole) => Promise<{ error: string | null }>
  updateCollaboratorRole: (collaboratorId: string, role: CollaboratorRole) => Promise<void>
  removeCollaborator: (collaboratorId: string) => Promise<void>
}

export const useVocaStore = create<VocaState>((set, get) => ({
  folders: [],
  vocaSets: [],
  communityVocaSets: [],
  currentVoca: null,
  words: [],
  collaborators: [],
  loading: false,

  fetchFolders: async () => {
    set({ loading: true })
    try {
      const folders = await apiRequest<Folder[]>('/folders')
      set({ folders, loading: false })
    } catch {
      set({ folders: [], loading: false })
    }
  },

  createFolder: async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    await apiRequest('/folders', {
      method: 'POST',
      body: JSON.stringify({ name: trimmed }),
    })
    await get().fetchFolders()
  },

  updateFolder: async (id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    await apiRequest(`/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: trimmed }),
    })
    await get().fetchFolders()
  },

  deleteFolder: async (id) => {
    await apiRequest(`/folders/${id}`, { method: 'DELETE' })
    await get().fetchFolders()
  },

  fetchVocaSets: async (folderId) => {
    const suffix = folderId ? `?folderId=${encodeURIComponent(folderId)}` : ''
    const fetched = await apiRequest<VocaSet[]>(`/vocas${suffix}`)
    const vocaSets = fetched.map(normalizeVocaSet)
    set({ vocaSets })
    return vocaSets
  },

  fetchCommunityVocaSets: async () => {
    const fetched = await apiRequest<VocaSet[]>('/community/vocas', { auth: 'optional' })
    const communityVocaSets = fetched.map(normalizeVocaSet)
    set({ communityVocaSets })
    return communityVocaSets
  },

  fetchVocaSet: async (id) => {
    set({ loading: true })
    try {
      const voca = normalizeVocaSet(await apiRequest<VocaSet>(`/vocas/${id}`, { auth: 'optional' }))
      set({ currentVoca: voca, loading: false })
    } catch {
      set({ currentVoca: null, loading: false })
    }
  },

  fetchSharedVocaByToken: async (shareToken) => {
    set({ loading: true })
    try {
      const voca = normalizeVocaSet(await apiRequest<VocaSet>(`/shared/${shareToken}`, { auth: 'none' }))
      set({ currentVoca: voca, loading: false })
      return voca
    } catch {
      set({ currentVoca: null, loading: false })
      return null
    }
  },

  fetchMyRole: async (vocaId) => {
    try {
      const data = await apiRequest<ApiRoleResponse>(`/vocas/${vocaId}/role`, { auth: 'optional' })
      return data.role
    } catch {
      return null
    }
  },

  createVocaSet: async (data) => {
    try {
      const shareScope = normalizeShareScope(data)
      const payload = {
        title: data.title || '',
        description: data.description || '',
        folder_id: data.folder_id || null,
        share_scope: shareScope,
        is_public: shareScope !== 'private',
      }
      const created = await apiRequest<{ id: string }>('/vocas', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return created.id
    } catch {
      return null
    }
  },

  updateVocaSet: async (id, data) => {
    const payload = data.share_scope
      ? {
          ...data,
          is_public: data.share_scope !== 'private',
        }
      : data

    await apiRequest(`/vocas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    await get().fetchVocaSet(id)
  },

  deleteVocaSet: async (id) => {
    await apiRequest(`/vocas/${id}`, { method: 'DELETE' })
  },

  cloneVocaSet: async (id) => {
    try {
      const created = await apiRequest<{ id: string }>(`/vocas/${id}/clone`, { method: 'POST' })
      return created.id
    } catch {
      return null
    }
  },

  fetchWords: async (vocaId) => {
    try {
      const words = await apiRequest<Word[]>(`/vocas/${vocaId}/words`, { auth: 'optional' })
      set({ words })
    } catch {
      set({ words: [] })
    }
  },

  addWord: async (word) => {
    await apiRequest(`/vocas/${word.voca_id}/words`, {
      method: 'POST',
      body: JSON.stringify({
        word: word.word,
        meaning: normalizeMeaningText(word.meaning),
        pos: word.pos,
        example: word.example,
      }),
    })
    await get().fetchWords(word.voca_id)
  },

  addWordsBulk: async (vocaId, words) => {
    const normalized = words
      .map((item) => ({
        word: String(item.word || '').trim(),
        meaning: normalizeMeaningText(String(item.meaning || '').trim()),
        pos: String(item.pos || '').trim(),
        example: String(item.example || '').trim(),
      }))
      .filter((item) => item.word && item.meaning)

    if (normalized.length === 0) return 0

    await apiRequest<{ inserted: number }>(`/vocas/${vocaId}/words/bulk`, {
      method: 'POST',
      body: JSON.stringify({ words: normalized }),
    })
    await get().fetchWords(vocaId)
    return normalized.length
  },

  updateWord: async (id, data) => {
    await apiRequest(`/words/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const words = get().words
    set({ words: words.map((word) => (word.id === id ? { ...word, ...data } : word)) })
  },

  deleteWord: async (id) => {
    const found = get().words.find((word) => word.id === id)
    await apiRequest(`/words/${id}`, { method: 'DELETE' })
    if (found) await get().fetchWords(found.voca_id)
  },

  importCSV: async (vocaId, csvText) => {
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    let success = 0
    let errors = 0
    const wordsToInsert: WordInsert[] = []
    const rows = lines[0]?.toLowerCase().startsWith('word,') ? lines.slice(1) : lines

    for (const row of rows) {
      const parts = row.split(',').map((part) => part.trim())
      const [word, meaning, pos = '', example = ''] = parts
      if (word && meaning) {
        wordsToInsert.push({
          voca_id: vocaId,
          word,
          meaning: normalizeMeaningText(meaning),
          pos,
          example,
        })
        success += 1
      } else {
        errors += 1
      }
    }

    if (wordsToInsert.length > 0) {
      await apiRequest(`/vocas/${vocaId}/words/bulk`, {
        method: 'POST',
        body: JSON.stringify({
          words: wordsToInsert.map((word) => ({
            word: word.word,
            meaning: word.meaning,
            pos: word.pos,
            example: word.example,
          })),
        }),
      })
      await get().fetchWords(vocaId)
    }

    return { success, errors }
  },

  fetchCollaborators: async (vocaId) => {
    const data = await apiRequest<VocaCollaborator[]>(`/vocas/${vocaId}/collaborators`)
    const collaborators = (data || []).map((item) => ({
      ...item,
      user: Array.isArray(item.user) ? item.user[0] : item.user,
    }))
    set({ collaborators })
  },

  inviteCollaborator: async (vocaId, email, role) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return { error: '이메일을 입력해주세요.' }

    try {
      await apiRequest(`/vocas/${vocaId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, role }),
      })
      await get().fetchCollaborators(vocaId)
      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : '초대에 실패했습니다.' }
    }
  },

  updateCollaboratorRole: async (collaboratorId, role) => {
    await apiRequest(`/collaborators/${collaboratorId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
    const collaborators = get().collaborators.map((collaborator) =>
      collaborator.id === collaboratorId ? { ...collaborator, role } : collaborator
    )
    set({ collaborators })
  },

  removeCollaborator: async (collaboratorId) => {
    await apiRequest(`/collaborators/${collaboratorId}`, { method: 'DELETE' })
    const collaborators = get().collaborators.filter((collaborator) => collaborator.id !== collaboratorId)
    set({ collaborators })
  },
}))
