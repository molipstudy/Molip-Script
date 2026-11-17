import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../shared/api'
import type { AccountProfile } from './profile'
export function useAccountProfile(userId: string) {
  const [state, setState] = useState<{ userId: string; data: AccountProfile | null; error: string }>({ userId: '', data: null, error: '' })
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    if (!userId || !supabase) return
    let active = true
    void (async () => {
      const { data, error } = await supabase!.rpc('my_profile')
      if (active) setState({ userId, data: error ? null : data as AccountProfile, error: error || !data ? '회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' : '' })
    })()
    return () => { active = false }
  }, [userId, revision])
  const accept = useCallback((data: AccountProfile) => setState({ userId: data.id, data, error: '' }), [])
  return { accept, profile: state.userId === userId ? state.data : null, error: state.userId === userId ? state.error : '', refresh }
}
