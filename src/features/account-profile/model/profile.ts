export type AccountProfile = { id: string; username: string; email: string | null; full_name: string | null; phone_number: string | null }
export const normalizeUsername = (value: string) => value.normalize('NFC').trim().toLowerCase()
export const validUsername = (value: string) => /^[a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ][a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ._-]{1,31}$/.test(normalizeUsername(value))
export const normalizePhone = (value: string) => {
  const phone = value.replace(/[\s()-]/g, '')
  return /^010\d{8}$/.test(phone) ? `+82${phone.slice(1)}` : phone
}
export const validPhone = (value: string) => !value.trim() || /^\+[1-9]\d{7,14}$/.test(normalizePhone(value))
export const missingProfileFields = (profile: AccountProfile) => [!profile.full_name?.trim() && '이름', !profile.phone_number?.trim() && '전화번호'].filter(Boolean) as string[]
