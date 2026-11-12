import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../../shared/api'
import type { CommunityScript, CommunitySummary } from '../../../entities/community'

export function useCommunityStats(scripts: CommunityScript[], userId: string) {
  const key = JSON.stringify(scripts.map(script => script.id).sort())
  const [stats, setStats] = useState<Record<string, CommunitySummary>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const sequence = useRef(0)
  const mutation = useRef(false)
  const cancel = useCallback(() => { sequence.current++ }, [])
  const reload = useCallback(async () => {
    const request = ++sequence.current
    try {
      if (!supabase) return
      const ids: string[] = JSON.parse(key)
      const { data, error } = await supabase.rpc('community_summary', { p_script_ids: ids })
      if (request !== sequence.current) return
      if (error) throw error
      setStats(Object.fromEntries(((data ?? []) as CommunitySummary[]).map(row => [row.script_id, row])))
      setError('')
    } catch {
      if (request === sequence.current) setError('반응 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }, [key])
  useEffect(() => {
    setStats({})
    void reload()
    return cancel
  }, [reload, userId, cancel])
  const like = async (scriptId: string) => {
    if (!supabase || !userId || mutation.current || !stats[scriptId]) return
    mutation.current = true
    setBusy(true)
    try {
      const liked = stats[scriptId].liked
      const result = liked
        ? await supabase.from('community_likes').delete().eq('script_id', scriptId).eq('user_id', userId)
        : await supabase.from('community_likes').upsert({ script_id: scriptId, user_id: userId }, { onConflict: 'script_id,user_id', ignoreDuplicates: true })
      if (result.error) throw result.error
      await reload()
    } catch { setError('좋아요를 변경하지 못했어요. 다시 시도해 주세요.') }
    finally { mutation.current = false; setBusy(false) }
  }
  return { stats, error, busy, reload, like }
}
