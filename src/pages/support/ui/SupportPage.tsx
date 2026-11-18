import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../shared/api'
import { Icon, LoadingSkeleton } from '../../../shared/ui'
import './support.css'

type Thread = { id: string; title: string; status: 'waiting' | 'answered'; updated_at: string; username?: string; preview?: string }
type Detail = { thread: Thread; messages: { id: string; sender_kind: 'admin' | 'member'; body: string; created_at: string }[]; total_messages: number }
type List = { items: Thread[]; total: number }
const date = (value: string) => new Date(value).toLocaleString('ko-KR')
const status = (value: string) => value === 'answered' ? '답변 완료' : '답변 대기'

export function SupportPage({ admin = false, onAdminBack }: { admin?: boolean; onAdminBack?: () => void }) {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [reply, setReply] = useState('')
  const [page, setPage] = useState(0)
  const [messagePage, setMessagePage] = useState(0)
  const [list, setList] = useState<List | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState('')
  const [sendError, setSendError] = useState('')
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  const lock = useRef(false)
  const requestId = useRef(0)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    let active = true
    const id = ++requestId.current
    void (async () => {
      try {
        const result = threadId
          ? await supabase!.rpc('support_detail', { p_thread_id: threadId, p_admin: admin, p_page: messagePage })
          : await supabase!.rpc('support_list', { p_admin: admin, p_page: page })
        if (!active || requestId.current !== id) return
        if (result.error) { setError('문의를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'); return }
        if (threadId) setDetail(result.data as Detail)
        else setList(result.data as List)
      } catch { if (active && requestId.current === id) setError('문의를 불러오지 못했어요. 연결 상태를 확인해 주세요.') }
    })()
    return () => { active = false }
  }, [threadId, admin, page, messagePage, revision])
  const refresh = () => { setError(''); setRevision(value => value + 1) }
  const open = (id: string | null) => { setThreadId(id); setComposing(false); setDetail(null); setError(''); setSendError(''); setReply(''); setMessagePage(0); heading.current?.focus() }
  const send = async () => {
    if (lock.current || (threadId ? !reply.trim() : !title.trim() || !body.trim())) return
    lock.current = true; setBusy(true); setSendError('')
    try {
      if (threadId) {
        const result = await supabase!.rpc('support_reply', { p_thread_id: threadId, p_body: reply.trim(), p_admin: admin })
        if (result.error) { setSendError('메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.'); return }
        setReply(''); setMessagePage(0); refresh()
      } else {
        const result = await supabase!.rpc('support_create', { p_title: title.trim(), p_body: body.trim() })
        if (result.error || !result.data) { setSendError('문의를 보내지 못했어요. 잠시 후 다시 시도해 주세요.'); return }
        setTitle(''); setBody(''); setList(null); open(result.data as string)
      }
    } catch { setSendError('전송 결과를 확인하지 못했어요. 문의 내역을 새로고침해 확인해 주세요.') }
    finally { lock.current = false; setBusy(false) }
  }
  const changePage = (next: number) => { setPage(next); setList(null); setError('') }
  return <section className="support-page">
    <div className="page-top"><div>{admin && onAdminBack && <button className="text-btn" onClick={onAdminBack}><Icon name="back" />관리자</button>}<p className="eyebrow">Molip Study</p><h1 ref={heading} tabIndex={-1}>{admin ? '문의함' : '문의하기'}</h1><p className="page-description">{admin ? '회원의 문의를 확인하고 답변해 주세요.' : '궁금한 점을 남겨 주세요. 답변은 이곳에서 확인할 수 있어요.'}</p></div><div className="button-row"><button disabled={busy} onClick={refresh}><Icon name="reset" />새로고침</button>{!admin && !composing && !threadId && <button className="primary-btn" onClick={() => { setComposing(true); setSendError('') }}><Icon name="plus" />새 문의</button>}</div></div>
    {(threadId || composing) && <button className="text-btn support-back" disabled={busy} onClick={() => open(null)}><Icon name="back" />문의 목록</button>}
    {composing ? <form className="body-panel support-compose" onSubmit={event => { event.preventDefault(); void send() }}><h2>새 문의</h2><label className="field"><span>제목</span><input required maxLength={100} value={title} disabled={busy} onChange={event => setTitle(event.target.value)} /></label><label className="field"><span>문의 내용</span><textarea required maxLength={4000} rows={8} value={body} disabled={busy} onChange={event => setBody(event.target.value)} /></label>{sendError && <p role="alert" className="error-text">{sendError}</p>}<button className="primary-btn" type="submit" disabled={busy || !title.trim() || !body.trim()} aria-busy={busy}>{busy ? '보내는 중…' : '문의 보내기'}</button></form>
      : error ? <div role="alert" className="body-panel"><p>{error}</p><button onClick={refresh}>다시 시도</button></div>
      : threadId ? !detail ? <LoadingSkeleton view="support-detail" /> : <section className="body-panel support-conversation"><header><h2>{detail.thread.title}</h2><span className={`support-status ${detail.thread.status}`}>{status(detail.thread.status)}</span>{admin && detail.thread.username && <p className="muted">{detail.thread.username}</p>}</header>
        {detail.total_messages > 25 && <div className="support-pagination"><button disabled={(messagePage + 1) * 25 >= detail.total_messages} onClick={() => { setDetail(null); setMessagePage(value => value + 1) }}>이전 대화</button><span>{messagePage === 0 ? '최근 대화' : `${messagePage + 1}번째 대화 묶음`}</span><button disabled={messagePage === 0} onClick={() => { setDetail(null); setMessagePage(value => value - 1) }}>최근 대화</button></div>}
        <ol className="support-messages">{detail.messages.map(message => <li key={message.id} className={`support-message ${message.sender_kind}`}><div><strong>{message.sender_kind === 'admin' ? '몰입 스터디' : admin ? detail.thread.username || '회원' : '나'}</strong><time dateTime={message.created_at}>{date(message.created_at)}</time></div><p>{message.body}</p></li>)}</ol>
        <form className="support-reply" onSubmit={event => { event.preventDefault(); void send() }}><label className="field"><span>{admin ? '답변' : '추가 메시지'}</span><textarea required maxLength={4000} rows={4} value={reply} disabled={busy} onChange={event => setReply(event.target.value)} /></label>{sendError && <p role="alert" className="error-text">{sendError}</p>}<button className="primary-btn" type="submit" disabled={busy || !reply.trim()} aria-busy={busy}>{busy ? '보내는 중…' : admin ? '답변 보내기' : '메시지 보내기'}</button></form>
      </section>
      : !list ? <LoadingSkeleton view="support" /> : !list.items.length ? <section className="empty-state"><Icon name="message" /><h2>{admin ? '접수된 문의가 없어요' : '아직 남긴 문의가 없어요'}</h2><p>{admin ? '새 문의가 접수되면 이곳에서 확인할 수 있어요.' : '새 문의 버튼을 눌러 메시지를 남겨 주세요.'}</p></section> : <><div className="support-thread-list">{list.items.map(thread => <button className="support-thread" key={thread.id} onClick={() => open(thread.id)}><div><strong>{thread.title}</strong><p>{thread.preview}</p><small>{admin && thread.username ? `${thread.username} · ` : ''}{date(thread.updated_at)}</small></div><span className={`support-status ${thread.status}`}>{status(thread.status)}</span><Icon name="chevron" /></button>)}</div>{list.total > 25 && <div className="support-pagination"><button disabled={page === 0} onClick={() => changePage(page - 1)}>이전</button><span>{page + 1} / {Math.ceil(list.total / 25)}</span><button disabled={(page + 1) * 25 >= list.total} onClick={() => changePage(page + 1)}>다음</button></div>}</>}
  </section>
}
