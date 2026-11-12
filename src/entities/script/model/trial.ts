import type { ScriptRecord } from './types'

// Bundled separately from user-owned records: never inserted into the database.
export const TRIAL_ID = 'molip-trial'
export const trialScript: ScriptRecord = {
  id: TRIAL_ID, title: '하루를 바꾸는 작은 습관 · 체험', excludedWords: [],
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', lastOpenedAt: '2026-01-01T00:00:00Z',
  rawText: `1. 작은 발걸음이 큰 변화를 만듭니다.
Small steps make a big difference.

2. 완벽하지 않아도 매일 연습하세요.
Practice every day, even when it is not perfect.

3. 오늘 배운 것을 내일 다시 떠올려 보세요.
Try to remember tomorrow what you learned today.

4. 당신의 속도로 계속 나아가세요.
Keep moving forward at your own pace.

5. 나는 조금씩 더 자신감을 얻고 있습니다.
I am becoming more confident, one sentence at a time.`,
}
