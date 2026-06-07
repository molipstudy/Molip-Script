export const splitMeanings = (raw: string) => {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const normalizeMeaningText = (raw: string) => {
  return splitMeanings(raw).join(', ')
}
