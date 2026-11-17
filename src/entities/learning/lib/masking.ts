// Each source sentence has one current evaluation in a learning session.
export const queueUnknown = (grades: Record<string, boolean>): number[] =>
  Object.entries(grades).filter(([, known]) => !known).map(([index]) => Number(index))

export type TokenVisibilityUpdate = number[] | ((current: number[]) => number[])

export function revealNextToken(current: number[], count: number): number[] {
  const next = Array.from({ length: count }, (_, index) => index).find(index => !current.includes(index))
  return next === undefined ? current : [...current, next]
}

// Keep delayed persistence in order, including the save performed before navigation.
export function createLearningSaveQueue() {
  let tail: Promise<unknown> = Promise.resolve()
  return <T>(save: () => Promise<T>): Promise<T> => {
    const task = tail.then(save)
    tail = task.catch(() => undefined)
    return task
  }
}
