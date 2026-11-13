export const storyContent = {
  problem: ['영어 본문, 외우기 막막하셨죠?', '몇 번을 읽어도 잘 외워지지 않고,', '외운 줄 알았는데 막상 써보면 기억이 안 나고.'],
  solution: ['그래서 몰입 스크립트를 만들었어요.', '영어 본문을 직접 등록하고, 다양한 방법으로 암기할 수 있어요.'],
  flashcard: ['해석만 보고 영어 문장이 떠오르나요?', '플래시카드로 확인해 보세요.'],
  dictation: ['문장을 정확하게 외웠는지 확인하고 싶다면?', '직접 입력해 보세요.'],
  masking: ['본문을 보면서 조금씩 외우고 싶다면?', '단어를 하나씩 가려 보세요.'],
  progress: ['어디까지 외웠는지 기억하기 어렵다면?', '학습 기록을 확인하세요.'],
} as const

export const demoSentences = [
  { meaning: '우리는 페이스 페인팅을 하거나 VR 게임을 할 수 있어.', english: 'We can do face painting or play VR games.' },
  { meaning: '너는 어느 것이 더 좋으니?', english: 'Which do you like more?' },
] as const

export const clampUnit = (value: number) => Math.max(0, Math.min(1, value))

// Reveal each line once, adding to the previous lines rather than replacing them.
export function frameStyle(progress: number, index: number, count: number) {
  if (index === 0 || count <= 1) return { opacity: 1, y: 0 }
  const opacity = clampUnit((progress - index * 0.25) / 0.2)
  return { opacity, y: (1 - opacity) * 18 }
}

export function dictationPhase(elapsed: number) {
  const time = Math.max(0, elapsed)
  const text = 'painting'
  return { answer: time < 900 ? '' : text.slice(0, Math.min(text.length, Math.floor((time - 900) / 190) + 1)), secondAnswer: time < 2600 ? '' : 'VR'.slice(0, Math.floor((time - 2600) / 190) + 1), pressed: time >= 3400 && time < 3700, graded: time >= 3700 }
}

export function maskingTokens(elapsed: number, count: number) {
  return Math.min(count, Math.max(0, Math.floor((elapsed - 1000) / 500)))
}

export const retainProgress = (previous: number, current: number) =>
  Math.max(clampUnit(previous), clampUnit(current))
