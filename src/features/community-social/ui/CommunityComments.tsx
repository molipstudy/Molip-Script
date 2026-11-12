import { useCallback, useEffect, useRef, useState } from 'react'
import type { CommunityComment } from '../../../entities/community'
import { supabase } from '../../../shared/api'
import { formatDateTime } from '../../../shared/lib'
import { AsyncButton } from '../../../shared/ui'
import { AutoTextarea } from '../../../shared/ui/AutoTextarea'

type Props = { scriptId: string; userId: string; onLogin: () => void; onPublisher: (id: string) => void; onChanged: () => Promise<void> }
export function CommunityComments({ scriptId, userId, onLogin, onPublisher, onChanged }: Props) {
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [busy, setBusy] = useState(false)
  const requests = useRef(0)
  const mutation = useRef(false)
  const cancel = useCallback(() => { requests.current++ }, [])
  const load = useCallback(async (cursor?: CommunityComment) => {
    const request = ++requests.current
    setLoading(true)
    try {
      if (!supabase) return
      const { data, error } = await supabase.rpc('community_comment_page', { p_script_id: scriptId, p_before: cursor?.created_at ?? null, p_before_id: cursor?.id ?? null })
      if (request !== requests.current) return
      if (error) throw error
      const page = (data ?? []) as CommunityComment[]
      setComments(previous => cursor ? [...previous, ...page.filter(row => !previous.some(item => item.id === row.id))] : page)
      setMore(page.length === 50)
      setError('')
    } catch { if (request === requests.current) setError('댓글을 불러오지 못했어요. 다시 시도해 주세요.') }
    finally { if (request === requests.current) setLoading(false) }
  }, [scriptId])
  useEffect(() => { setComments([]); void load(); return cancel }, [load, cancel])
  const write = async (id?: string) => {
    if (!userId) { onLogin(); return }
    if (!supabase || mutation.current || (!id && !body.trim())) return
    mutation.current = true
    setBusy(true)
    try {
      const result = id
        ? await supabase.from('community_comments').delete().eq('id', id).eq('user_id', userId)
        : await supabase.from('community_comments').insert({ script_id: scriptId, user_id: userId, body: body.trim() })
      if (result.error) throw result.error
      if (!id) setBody('')
      await load()
      await onChanged()
    } catch { setError(id ? '댓글을 삭제하지 못했어요.' : '댓글을 등록하지 못했어요. 다시 시도해 주세요.') }
    finally { mutation.current = false; setBusy(false) }
  }
  return <section className="community-comments body-panel" aria-labelledby="comments-title"><h2 id="comments-title">댓글</h2><p className="page-description">함께 공부하는 사람들과 의견을 나눠 보세요. 최근 댓글부터 표시합니다.</p>
    {userId ? <form onSubmit={event => { event.preventDefault(); void write() }}><label className="field"><span>댓글 작성</span><AutoTextarea rows={2} maxLength={1000} value={body} disabled={busy} onChange={event => setBody(event.target.value)} placeholder="스크립트에 대한 생각을 남겨 주세요." /></label><div className="comment-form-actions"><small>{body.length} / 1000</small><button className="primary-btn" disabled={busy || !body.trim()} type="submit">{busy ? '처리 중…' : '댓글 등록'}</button></div></form> : <button className="text-btn" onClick={onLogin}>로그인하고 댓글 남기기</button>}
    {error && <p className="error-text" role="alert">{error} <button className="text-btn" onClick={() => void load()}>다시 불러오기</button></p>}
    <div className="community-comment-list">{comments.map(comment => <article key={comment.id}><div className="comment-heading"><button className="text-btn publisher-link" onClick={() => onPublisher(comment.user_id)}>{comment.login_id}</button><small>{formatDateTime(comment.created_at)}</small>{comment.user_id === userId && <AsyncButton className="text-btn" disabled={busy} onAction={() => write(comment.id)}>삭제</AsyncButton>}</div><p>{comment.body}</p></article>)}</div>
    {loading && <p role="status">댓글을 불러오는 중…</p>}{!loading && !error && !comments.length && <p className="muted">첫 댓글을 남겨 보세요.</p>}
    {more && <AsyncButton disabled={loading || busy} onAction={() => load(comments.at(-1))}>댓글 더 보기</AsyncButton>}
  </section>
}
