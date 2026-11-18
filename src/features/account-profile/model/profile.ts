export type AccountProfile = { id: string; username: string; email: string | null; full_name: string | null; phone_number: string | null }
export const normalizeUsername = (value: string) => value.normalize('NFC').trim().toLowerCase()
export const validUsername = (value: string) => /^[a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ][a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ._-]{1,31}$/.test(normalizeUsername(value))
export const normalizePhone = (value: string) => {
  const phone = value.replace(/[\s()-]/g, '')
  return /^010\d{8}$/.test(phone) ? `+82${phone.slice(1)}` : phone
}
export const validPhone = (value: string) => !value.trim() || /^\+[1-9]\d{7,14}$/.test(normalizePhone(value))
export const missingProfileFields = (profile: AccountProfile) => [!profile.full_name?.trim() && '이름', !profile.phone_number?.trim() && '전화번호'].filter(Boolean) as string[]

export type SignupDetails = { fullName: string; phoneNumber: string; signupSource: string; signupSourceOther?: string }
export function signupDetailsError(details?: SignupDetails): string {
  const name = details?.fullName.trim() || ''
  if (!name || name.length > 80 || Array.from(name).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return '이름을 1~80자로 입력해 주세요.'
  if (!details?.phoneNumber.trim() || !validPhone(details.phoneNumber)) return '전화번호를 확인해 주세요. 국내 휴대전화는 010으로 입력하세요.'
  if (!['지인 홍보', '커뮤니티', 'Instagram', '기타'].includes(details.signupSource)) return '가입 경로를 선택해 주세요.'
  if (details.signupSource === '기타' && (!details.signupSourceOther?.trim() || details.signupSourceOther.trim().length > 120 || Array.from(details.signupSourceOther).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))) return '기타 가입 경로를 120자 이내로 입력해 주세요.'
  return ''
}
