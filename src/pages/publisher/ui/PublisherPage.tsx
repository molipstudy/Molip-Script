import { useCallback, useEffect, useRef, useState } from 'react'
import type { CommunityScript, CommunityScriptRow, PublisherProfile } from '../../../entities/community'
import { parseItems } from '../../../entities/script'
import { supabase } from '../../../shared/api'
import { AsyncButton, Icon, LoadingSkeleton } from '../../../shared/ui'
import { useCommunityStats } from '../../../features/community-social/model/useCommunityStats'
import { CommunityCounts } from '../../../features/community-social/ui/CommunityCounts'

type Props = { publisherId: string; userId: string; onBack: () => void; onSelect: (id: string) => void; onLogin: () => void }
export function PublisherPage({ publisherId, userId, onBack, onSelect, onLogin }: Props) {
  const [profile, setProfile] = useState<PublisherProfile | null>(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState('')
  const [published, setPublished] = useState<CommunityScript[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsError, setPostsError] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const postRequest = useRef(0)
  const request = useRef(0)
  const mutation = useRef(false)
  const { stats } = useCommunityStats(published, userId)
  const cancel = useCallback(() => { request.current++ }, [])
  const load = useCallback(async () => {
    const current = ++request.current
    setPending(true)
    try {
      if (!supabase) return
      const { data, error } = await supabase.rpc('community_author', { p_user_id: publisherId })
      if (current !== request.current) return
      if (error) throw error
      setProfile((data?.[0] as PublisherProfile) ?? null)
      setError('')
    } catch { if (current === request.current) setError('게시자 정보를 불러오지 못했어요. 다시 시도해 주세요.') }
    finally { if (current === request.current) setPending(false) }
  }, [publisherId])
  useEffect(() => { setProfile(null); void load(); return cancel }, [load, userId, cancel])
  const cancelPosts = useCallback(() => { postRequest.current++ }, [])
  const loadPosts = useCallback(async (offset = 0) => {
    const current = ++postRequest.current
    setPostsLoading(true)
    try {
      if (!supabase) return
      const { data, error } = await supabase.from('community_scripts').select('*').eq('owner_id', publisherId).order('shared_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 49)
      if (current !== postRequest.current) return
      if (error) throw error
      const rows = (data ?? []) as CommunityScriptRow[]
      const next = rows.map(row => ({ id: row.id, ownerId: row.owner_id, ownerLoginId: row.owner_login_id, sourceScriptId: row.source_script_id, title: row.title, rawText: row.raw_text, excludedWords: row.excluded_words ?? [], sharedAt: row.shared_at }))
      setPublished(previous => offset ? [...previous, ...next.filter(row => !previous.some(item => item.id === row.id))] : next)
      setHasMore(rows.length === 50)
      setPostsError('')
    } catch { if (current === postRequest.current) setPostsError('공개 스크립트를 불러오지 못했어요.') }
    finally { if (current === postRequest.current) setPostsLoading(false) }
  }, [publisherId])
  useEffect(() => { setPublished([]); void loadPosts(); return cancelPosts }, [loadPosts, cancelPosts])
  const follow = async () => {
    if (!userId) { onLogin(); return }
    if (!profile || !supabase || mutation.current || publisherId === userId) return
    mutation.current = true
    try {
      const result = profile.following
        ? await supabase.from('publisher_follows').delete().eq('publisher_id', publisherId).eq('user_id', userId)
        : await supabase.from('publisher_follows').upsert({ publisher_id: publisherId, user_id: userId }, { onConflict: 'publisher_id,user_id', ignoreDuplicates: true })
      if (result.error) throw result.error
      await load()
    } catch { setError('팔로우를 변경하지 못했어요. 다시 시도해 주세요.') }
    finally { mutation.current = false }
  }
  return <section className="publisher-page"><button className="text-btn" onClick={onBack}><Icon name="back" />커뮤니티</button>
    {error && <p className="error-text" role="alert">{error} <button onClick={() => void load()}>다시 시도</button></p>}
    {pending && !profile ? <LoadingSkeleton view="publisher" /> : profile ? <><header className="publisher-header"><span className="avatar">{profile.login_id.slice(0, 1).toUpperCase()}</span><div><p className="eyebrow">Publisher</p><h1>{profile.login_id}</h1><p>공개 스크립트 {profile.script_count} · 팔로워 {profile.follower_count} · 팔로잉 {profile.following_count}</p></div>{userId !== publisherId && <AsyncButton className={profile.following ? '' : 'primary-btn'} disabled={pending} aria-pressed={profile.following} onAction={follow}>{profile.following ? '팔로잉 · 취소' : '팔로우'}</AsyncButton>}</header><h2>공개한 스크립트</h2>{postsError && <p className="error-text" role="alert">{postsError} <button onClick={() => void loadPosts()}>다시 시도</button></p>}{postsLoading && !published.length ? <LoadingSkeleton view="community" compact /> : published.length ? <div className="community-grid">{published.map(script => <button className="community-card" key={script.id} onClick={() => onSelect(script.id)}><span className="community-card-icon"><Icon name="book" /><Icon name="arrow" /></span><strong>{script.title}</strong><small>문장 {parseItems(script.rawText).length}개</small><CommunityCounts summary={stats[script.id]} /></button>)}</div> : <p className="muted">{postsError ? '잠시 후 다시 확인해 주세요.' : '현재 공개 중인 스크립트가 없어요.'}</p>}{hasMore && <AsyncButton disabled={postsLoading} onAction={() => loadPosts(published.length)}>스크립트 더 보기</AsyncButton>}</> : !error && <p className="muted">게시자를 찾을 수 없어요.</p>}
  </section>
}
