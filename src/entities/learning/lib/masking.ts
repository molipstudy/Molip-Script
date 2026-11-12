// Each source sentence has one current evaluation in a learning session.
export const queueUnknown = (grades: Record<string, boolean>): number[] =>
  Object.entries(grades).filter(([, known]) => !known).map(([index]) => Number(index))
