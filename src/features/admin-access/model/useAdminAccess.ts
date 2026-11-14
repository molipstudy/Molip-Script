import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../shared/api'

type Access = { userId: string; allowed: boolean; pending: boolean; error: string }
export function useAdminAccess(userId: string) {
  const [revision, setRevision] = useState(0)
  const [access, setAccess] = useState<Access>({ userId: '', allowed: false, pending: false, error: '' })
  useEffect(() => {
    if (!userId || !supabase) return
    let active = true
    void (async () => {
      const { data, error } = await supabase!.rpc('admin_access')
      if (active) setAccess({ userId, allowed: !error && data === true, pending: false,
        error: error ? '관리자 권한을 확인하지 못했습니다.' : '' })
    })()
    return () => { active = false }
  }, [userId, revision])
  const refresh = useCallback(() => {
    setAccess({ userId: '', allowed: false, pending: true, error: '' })
    setRevision(value => value + 1)
  }, [])
  return {
    isAdmin: !!userId && access.userId === userId && access.allowed,
    pending: !!userId && (access.userId !== userId || access.pending),
    error: access.userId === userId ? access.error : '', refresh,
  }
}
