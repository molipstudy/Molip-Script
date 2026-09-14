// A gap is a position before a card, or items.length for the end of the list.
export function moveCardToGap<T extends { id: string; number: string }>(items: T[], id: string, gap: number): T[] {
  const from = items.findIndex((item) => item.id === id)
  if (from < 0 || gap < 0 || gap > items.length || !Number.isInteger(gap)) return items
  const to = gap > from ? gap - 1 : gap
  if (from === to) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next.map((card, index) => ({ ...card, number: String(index + 1) }))
}
