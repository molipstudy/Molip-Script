import { useEffect, useState } from 'react'
import { supabase } from '../../../shared/api'
import { Icon, LoadingSkeleton } from '../../../shared/ui'
import { date } from '../model/member'

type Commit = { sha: string; message: string; author?: string; createdAt?: string | null; url: string }
type Deployment = { id: string; state: string; createdAt: string | null; commit: Commit | null; url: string }
type Development = { checkedAt: string; vercel: { configured: boolean; currentAvailable: boolean; latestAvailable: boolean; current: Deployment | null; latest: Deployment | null }; github: { available: boolean; commits: Commit[] | null } }
const states: Record<string, string> = { READY: '배포 완료', ERROR: '배포 실패', CANCELED: '취소됨', BUILDING: '빌드 중', QUEUED: '대기 중', INITIALIZING: '준비 중', BLOCKED: '보류됨', UNKNOWN: '상태 확인 필요' }
function DeploymentStatus({ deployment }: { deployment: Deployment }) {
 return <span className={`deployment-status deployment-${deployment.state.toLowerCase()}`}><i />{states[deployment.state] || states.UNKNOWN}</span>
}
export function AdminDevelopmentPage() {
 const [revision, setRevision] = useState(0)
 const [data, setData] = useState<Development | null>(null)
 const [error, setError] = useState('')
 useEffect(() => {
  const controller = new AbortController()
  void (async () => {
   try {
    const { data: session } = await supabase!.auth.getSession()
    if (!session.session?.access_token) throw new Error()
    const response = await fetch('/api/admin-development', { headers: { Authorization: `Bearer ${session.session.access_token}` }, cache: 'no-store', signal: controller.signal })
    if (!response.ok) throw new Error()
    const result = await response.json() as Development
    if (!controller.signal.aborted) setData(result)
   } catch { if (!controller.signal.aborted) setError('개발·배포 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.') }
  })()
  return () => controller.abort()
 }, [revision])
 const refresh = () => { setData(null); setError(''); setRevision(value => value + 1) }
 return <section className="admin-page admin-development">
  <header className="page-top"><div><p className="eyebrow">Development</p><h1>개발·배포</h1><p className="page-description">현재 운영 배포와 최근 변경 내용을 확인하세요.</p></div><button onClick={refresh} disabled={!data && !error}><Icon name="reset" />새로고침</button></header>
  {error ? <p className="admin-empty" role="alert">{error}</p> : !data ? <LoadingSkeleton view="admin-development" compact /> : <DevelopmentContent data={data} />}
 </section>
}

export function DevelopmentContent({ data }: { data: Development }) {
 const current = data.vercel.current, latest = data.vercel.latest
 const latestCommit = data.github.commits?.[0]
 const matched = current?.state === 'READY' && current.commit && latestCommit ? current.commit.sha === latestCommit.sha : null
 return <>
   <section className="development-panel" aria-labelledby="production-heading"><div className="metrics-panel-top"><h2 id="production-heading">현재 운영 배포</h2>{current && data.vercel.currentAvailable ? <DeploymentStatus deployment={current} /> : null}</div>
    {!data.vercel.configured ? <p className="muted">Vercel 연결 설정이 필요해요.</p> : !data.vercel.currentAvailable ? <p className="muted">운영 배포를 불러오지 못했어요. 연결과 조회 권한을 확인해 주세요.</p> : !current ? <p className="muted">아직 운영 배포가 없어요.</p> : <>
     <p className="development-commit">{current.commit ? <a href={current.commit.url} target="_blank" rel="noopener noreferrer">{current.commit.message || current.commit.sha.slice(0, 7)}</a> : '연결된 커밋 정보가 없어요'}</p>
     <p className="development-meta">{current.commit && <code>{current.commit.sha.slice(0, 7)}</code>}<span>배포 생성 · {date(current.createdAt)}</span></p>
     {matched !== null && <p className={`development-sync ${matched ? 'synced' : ''}`}>{matched ? '최신 main 커밋이 운영 사이트에 반영됐어요' : '최신 main 커밋과 운영 배포의 커밋이 달라요'}</p>}
     <div className="development-links"><a href={current.url} target="_blank" rel="noopener noreferrer">Vercel에서 보기<Icon name="arrow" /></a><a href="https://script.molip.kro.kr" target="_blank" rel="noopener noreferrer">운영 사이트<Icon name="arrow" /></a></div>
    </>}
    {data.vercel.latestAvailable && latest && latest.id !== current?.id && <aside className="development-attempt"><div><strong>최근 배포 시도</strong><DeploymentStatus deployment={latest} /></div><p>{latest.commit?.message || latest.commit?.sha.slice(0, 7) || '커밋 정보 없음'}</p><small>{date(latest.createdAt)}</small><a href={latest.url} target="_blank" rel="noopener noreferrer">배포 확인<Icon name="arrow" /></a></aside>}
    {!data.vercel.latestAvailable && data.vercel.configured && <p className="development-meta">최근 배포 시도는 불러오지 못했어요.</p>}
   </section>
   <section className="development-panel" aria-labelledby="commits-heading"><div className="metrics-panel-top"><h2 id="commits-heading">최근 커밋 <span className="development-branch">main</span></h2><a href="https://github.com/molipstudy/Molip-Script/commits/main" target="_blank" rel="noopener noreferrer">GitHub에서 보기<Icon name="arrow" /></a></div>
    {!data.github.available ? <p className="muted">커밋 목록을 불러오지 못했어요. 잠시 후 새로고침해 주세요.</p> : !data.github.commits?.length ? <p className="muted">표시할 커밋이 없어요.</p> : <ol className="development-commits">{data.github.commits.map(commit => <li key={commit.sha}><a href={commit.url} target="_blank" rel="noopener noreferrer"><div><strong>{commit.message || '커밋 메시지 없음'}</strong><span>{commit.author || '작성자 정보 없음'} · {date(commit.createdAt || null)}</span></div><code>{commit.sha.slice(0, 7)}</code><Icon name="arrow" /></a></li>)}</ol>}
   </section><p className="development-meta" role="status">마지막 확인 · {date(data.checkedAt)}</p>
 </>
}
