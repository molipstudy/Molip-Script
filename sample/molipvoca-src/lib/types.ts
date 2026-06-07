export interface User {
  id: string
  email: string
  username: string
  profile_image?: string
  created_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  created_at: string
  voca_sets?: VocaSet[]
}

export interface VocaSet {
  id: string
  owner_id: string
  folder_id: string | null
  title: string
  description: string
  share_scope: 'private' | 'unlisted' | 'public'
  is_public: boolean
  share_token: string
  created_at: string
  updated_at: string
  word_count?: number
  owner?: { username: string; email?: string }
}

export interface Word {
  id: string
  voca_id: string
  word: string
  meaning: string
  pos: string
  example?: string
  created_at: string
}

export interface VocaCollaborator {
  id: string
  user_id: string
  voca_id: string
  role: 'editor' | 'viewer'
  created_at: string
  user?: { username: string; email: string }
}

export interface WordProgress {
  id: string
  user_id: string
  word_id: string
  correct_count: number
  wrong_count: number
  last_reviewed_at: string
}

export interface StudySession {
  id: string
  user_id: string
  voca_id: string
  mode: 'flashcard' | 'multiple_choice' | 'writing'
  score: number
  total: number
  duration: number
  created_at: string
}
