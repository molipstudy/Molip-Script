type Member = { id: string; login_id: string | null; username: string | null; email: string | null; signup_source: string; created_at: string; last_sign_in_at: string | null; has_profile: boolean }
export type MemberList = { items: Member[]; total: number; total_members: number; script_members: number }
export type Detail = Member & { email_confirmed_at: string | null; profile_created_at: string | null; script_count: number; shared_count: number; active_count: number; completed_count: number }
export const date = (value: string | null) => value ? new Date(value).toLocaleString('ko-KR') : '기록 없음'
export const number = (value: number) => value.toLocaleString('ko-KR')

