import { useEffect, useState } from 'react'
import { supabase } from '../../../shared/api'
import type { ScriptRow } from '../../../entities/script'
import { parseItems } from '../../../entities/script'
import { LoadingSkeleton } from '../../../shared/ui'
import { ErrorPage } from '../../error/ui/ErrorPage'
import { ScriptPage } from '../../script/ui/ScriptPage'

type Preview = ScriptRow & { owner_id: string }
const noop = () => undefined
const asyncNoop = async () => undefined
export function AdminScriptPage({ scriptId, onBack, onCopy }: { scriptId: string; onBack: (ownerId?: string) => void; onCopy: (id: string) => Promise<unknown> }) {
  const [row, setRow] = useState<Preview | null>(null)
  const [status, setStatus] = useState<'loading' | 'missing' | 'error' | 'ready'>('loading')
  const [revision, setRevision] = useState(0)
  const [showMeaning, setShowMeaning] = useState(true)
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const result = await supabase!.rpc('admin_script_preview', { p_script_id: scriptId })
        if (!active) return
        if (result.error) { setStatus(result.error.code === '42501' ? 'missing' : 'error'); return }
        if (!result.data) { setStatus('missing'); return }
        setRow(result.data as Preview); setStatus('ready')
      } catch { if (active) setStatus('error') }
    })()
    return () => { active = false }
  }, [scriptId, revision])
  if (status === 'loading') return <LoadingSkeleton view="script" />
  if (status !== 'ready' || !row) return <ErrorPage code={status === 'missing' ? 404 : 503} onHome={() => onBack()} onRetry={status === 'error' ? () => { setStatus('loading'); setRevision(value => value + 1) } : undefined} />
  const script = { id: row.id, title: row.title, rawText: row.raw_text, excludedWords: row.excluded_words || [], createdAt: row.created_at, updatedAt: row.updated_at, lastOpenedAt: row.last_opened_at }
  return <ScriptPage script={script} items={parseItems(row.raw_text)} stats={{}} wordStats={[]} historyCount={0} activeLearnings={[]} showMeaning={showMeaning} onShowMeaningChange={setShowMeaning} onBack={() => onBack(row.owner_id)} onEdit={noop} onOpenHistory={noop} onOpenStudy={noop} onResume={noop} onDeleteActive={asyncNoop} onToggleStar={asyncNoop} adminPreview onCopy={() => onCopy(row.id)} />
}
