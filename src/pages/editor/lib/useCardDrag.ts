import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'

type Drag = { id: string; gap: number | null }
type PointerDrag = Drag & { pointerId: number; x: number; y: number; startX: number; startY: number; moved: boolean }

export function useCardDrag(onDrop: (id: string, gap: number) => void) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const pointer = useRef<PointerDrag | null>(null)
  const frame = useRef(0)
  const [drag, setDrag] = useState<Drag | null>(null)
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const updateTarget = () => {
    const current = pointer.current
    const list = listRef.current
    if (!current || !list || !current.moved) return
    const bounds = list.getBoundingClientRect()
    let gap: number | null = null
    if (current.x >= bounds.left - 24 && current.x <= bounds.right + 24 && current.y >= bounds.top - 32 && current.y <= bounds.bottom + 32) {
      const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-sort-card]'))
      const next = cards.findIndex((card) => {
        const rect = card.getBoundingClientRect()
        return current.y < rect.top + rect.height / 2
      })
      gap = next === -1 ? cards.length : next
    }
    if (gap !== current.gap) {
      current.gap = gap
      setDrag({ id: current.id, gap })
    }
  }
  const autoScroll = () => {
    const current = pointer.current
    if (!current) return
    if (current.moved) {
      const edge = 80
      const speed = current.y < edge ? -Math.min(16, (edge - current.y) / 4)
        : current.y > window.innerHeight - edge ? Math.min(16, (current.y - window.innerHeight + edge) / 4) : 0
      if (speed) window.scrollBy(0, speed)
      updateTarget()
    }
    frame.current = requestAnimationFrame(autoScroll)
  }
  const cancel = () => {
    pointer.current = null
    cancelAnimationFrame(frame.current)
    setDrag(null)
  }
  const start = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    if (!event.isPrimary || event.button !== 0 || pointer.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointer.current = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false, gap: null }
    setDrag({ id, gap: null })
    frame.current = requestAnimationFrame(autoScroll)
  }
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const current = pointer.current
    if (!current || current.pointerId !== event.pointerId) return
    current.x = event.clientX
    current.y = event.clientY
    current.moved ||= Math.hypot(current.x - current.startX, current.y - current.startY) > 4
    updateTarget()
  }
  const end = (event: PointerEvent<HTMLButtonElement>) => {
    const current = pointer.current
    if (!current || current.pointerId !== event.pointerId) return
    move(event)
    const { id, gap, moved } = current
    cancel()
    if (moved && gap !== null) onDrop(id, gap)
  }

  return { listRef, drag, start, move, end, cancel }
}
