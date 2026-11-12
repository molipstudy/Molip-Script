export type CommunityScript = {
  id: string
  ownerId: string
  ownerLoginId: string
  sourceScriptId: string
  title: string
  excludedWords: string[]
  rawText: string
  sharedAt: string
}

export type CommunityScriptRow = {
  id: string
  owner_id: string
  owner_login_id: string
  source_script_id: string
  title: string
  excluded_words?: string[]
  raw_text: string
  shared_at: string
}

export type CommunitySummary = {
  script_id: string
  like_count: number
  collection_count: number
  comment_count: number
  liked: boolean
}
export type CommunityComment = {
  id: string
  user_id: string
  login_id: string
  body: string
  created_at: string
}
export type PublisherProfile = {
  id: string
  login_id: string
  script_count: number
  follower_count: number
  following_count: number
  following: boolean
}
