import { useEffect, useState } from 'react'
import { supabase } from '../../../shared/api'
import { parseItems, sentenceTokens } from '../../../entities/script'
import { LoadingSkeleton } from '../../../shared/ui'
import { date } from '../model/member'

type Item = { id: string; title: string; raw_text: string; created_at?: string; updated_at: string; quiz_type?: string; mode?: string; progress?: number; state?: { currentIndex?: number; queue?: number[]; visibleTokens?: number[]; unknownIndexes?: number[]; questions?: { item: { meaning: string; english: string }; units?: { blankId?: string }[] }[]; answersById?: Record<string, string>; maskingGrades?: Record<string, boolean> } }
type Result = { items: Item[]; total: number }
const kindName: Record<string, string> = { flashcard: '플래시카드', dictation: '받아쓰기', masking: '마스킹 학습' }
const scopeName: Record<string, string> = { standard: '전체 문장', weak: '취약 문장', starred: '별표 문장', range: '선택 범위' }

function LearningInfo({ item }: { item: Item }) {
  const state = item.state || {}
  const index = typeof state.currentIndex === 'number' ? state.currentIndex : 0
  const sentences = parseItems(item.raw_text)
  const total = state.questions?.length ?? state.queue?.length ?? 0
  const question = state.questions?.[index]
  const sentence = question?.item ?? sentences[state.queue?.[index] ?? index]
  const answers = question?.units?.filter(unit => unit.blankId).map(unit => state.answersById?.[unit.blankId!] || '미입력')
  return <div className="admin-learning-info"><dl className="admin-detail-list">
    <div><dt>학습 방식</dt><dd>{kindName[item.quiz_type!] || '학습'} · {scopeName[item.mode!] || item.mode}</dd></div>
    <div><dt>현재 위치</dt><dd>{total ? `${Math.min(index + 1, total)} / ${total}문장` : '기록 없음'}{total > 0 && index >= total ? ' · 완료' : ''}</dd></div>
    <div><dt>최근 저장</dt><dd>{date(item.updated_at)}</dd></div>
    {state.unknownIndexes && <div><dt>다시 연습</dt><dd>{state.unknownIndexes.length}문장</dd></div>}
  </dl>{sentence && <div className="admin-current-sentence"><h4>현재 학습 문장</h4><p>{sentence.meaning}</p><p lang="en">{sentence.english}</p>{answers?.length ? <p>입력 답안: {answers.join(' / ')}</p> : null}{item.quiz_type === 'masking' && <p>공개한 단어: {sentenceTokens(sentence.english).filter((_, i) => state.visibleTokens?.includes(i)).join(' ') || '없음'}</p>}</div>}</div>
}

export function MemberLearning({ memberId, kind }: { memberId: string; kind: 'scripts' | 'shared' | 'active' }) {
  const [page, setPage] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const response = await supabase!.rpc('admin_member_learning', { p_user_id: memberId, p_kind: kind, p_page: page })
        if (!active) return
        if (response.error || !response.data) { setError(response.error?.code === 'PGRST202' ? '조회 기능 준비가 필요해요. 관리자에게 문의해 주세요.' : '학습 정보를 불러오지 못했어요.'); return }
        setResult(response.data as Result)
      } catch { if (active) setError('학습 정보를 불러오지 못했어요.') }
    })()
    return () => { active = false }
  }, [memberId, kind, page, revision])
  const navigate = (next: number) => { setResult(null); setError(''); setPage(next) }
  return <section className="admin-learning-list" aria-label={kind === 'scripts' ? '보유 스크립트' : kind === 'shared' ? '공개 스크립트' : '진행 중 학습'}>
    <h3>{kind === 'scripts' ? '보유 스크립트' : kind === 'shared' ? '공개 스크립트' : '진행 중 학습'}</h3>
    {error ? <p role="alert">{error} <button onClick={() => { setError(''); setRevision(value => value + 1) }}>다시 시도</button></p> : !result ? <LoadingSkeleton view="member-list" compact /> : !result.items.length ? <p className="muted">등록된 {kind !== 'active' ? '스크립트가' : '진행 중 학습이'} 없어요.</p> : result.items.map(item => kind === 'scripts' ? <a className="admin-script-link" key={item.id} href={`/${encodeURIComponent(item.id)}`}><div><strong>{item.title}</strong><small>최근 수정 · {date(item.updated_at)}</small></div><span>본문 보기 →</span></a> : <details key={item.id} className="admin-learning-item"><summary><strong>{item.title}</strong><span>{kind === 'active' ? kindName[item.quiz_type!] : '본문 보기'}</span></summary>{kind === 'active' ? <LearningInfo item={item} /> : <><p className="muted">{kind === 'shared' ? '공개 일시' : '최근 수정'} · {date(item.updated_at)}</p>{kind === 'shared' && <a href={`/community/${encodeURIComponent(item.id)}`} target="_blank" rel="noopener noreferrer">커뮤니티에서 보기</a>}<div className="admin-script-body">{item.raw_text}</div></>}</details>)}
    {result && result.total > 25 && <div className="admin-pagination"><button disabled={page === 0} onClick={() => navigate(page - 1)}>이전</button><span>{page + 1} / {Math.ceil(result.total / 25)}</span><button disabled={(page + 1) * 25 >= result.total} onClick={() => navigate(page + 1)}>다음</button></div>}
  </section>
}
