import { useEffect, useState } from 'react'
import { supabase } from '../../../shared/api'
export type Counts = { visitors: number; pageviews: number }
export type Breakdown = Counts & { label: string }
export type Traffic = Counts & { connected: boolean; message?: string; recent: Counts | null; previous: Counts | null; daily: (Counts & { timestamp: string })[] | null; hourly: (Counts & { timestamp: string })[] | null; breakdowns: Record<string, Breakdown[] | null>; since: string; until: string }
export type Summary = { total_members: number; new_members: number; new_members_24h: number; previous_new_members: number; total_scripts: number; new_scripts: number; new_scripts_24h: number; total_shared: number; active_learnings: number; waiting_inquiries: number; new_inquiries: number; new_inquiries_24h: number; recent_members: { id: string; username: string | null; created_at: string }[]; recent_scripts: { id: string; title: string; username: string | null; created_at: string }[]; recent_inquiries: { id: string; title: string; username: string | null; status: string; updated_at: string }[]; daily: { timestamp: string; signups: number; scripts: number }[]; signup_sources: { label: string; count: number }[] }
export function useAdminMetrics(days: number, summary = false) {
 const [revision, setRevision] = useState(0)
 const [state, setState] = useState<{ traffic: Traffic | null; overview: Summary | null; trafficError: boolean; overviewError: boolean }>({ traffic: null, overview: null, trafficError: false, overviewError: false })
 useEffect(() => {
  const controller = new AbortController()
  const update = (next: Partial<typeof state>) => { if (!controller.signal.aborted) setState(value => ({ ...value, ...next })) }
  void (async () => {
   try { const result = await supabase!.rpc('admin_dashboard_summary', { p_days: days }); if (result.error || !result.data) throw new Error(); update({ overview: result.data as Summary }) } catch { update({ overviewError: true }) }
  })()
  void (async () => {
   try {
    const { data } = await supabase!.auth.getSession()
    if (!data.session?.access_token) throw new Error()
    const response = await fetch(`/api/admin-analytics?days=${days}${summary ? '&summary=1' : ''}`, { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: 'no-store', signal: controller.signal })
    if (!response.ok) throw new Error()
    update({ traffic: await response.json() as Traffic })
   } catch { update({ trafficError: true }) }
  })()
  return () => controller.abort()
 }, [days, summary, revision])
 return { ...state, refresh: () => { setState({ traffic: null, overview: null, trafficError: false, overviewError: false }); setRevision(value => value + 1) } }
}
export function growth(current: number | undefined, previous: number | undefined) {
 if (current === undefined || previous === undefined) return '이전 기간 비교 불가'
 if (!previous) return current ? '이전 기간 집계 없음' : '이전 기간과 동일'
 const value = (current - previous) / previous * 100
 return `이전 기간 대비 ${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}
