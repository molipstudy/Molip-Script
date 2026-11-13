import { useEffect, useRef, useState } from 'react'

// Each mounted demo owns exactly one playback interval and one interaction timeout.
export function useDemoPlayer(duration: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [reduced, setReduced] = useState(true)
  const [pageVisible, setPageVisible] = useState(true)
  const [paused, setPaused] = useState(false)
  const [manual, setManual] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completed = elapsed >= duration
  const playing = !completed && visible && enabled && pageVisible && !reduced && !paused && !manual
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const chapter = node.closest<HTMLElement>('[data-story-track]')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const visibility = () => setPageVisible(!document.hidden)
    const preference = () => setReduced(motion.matches)
    let intersecting = false
    let entered = false
    const chapterChange = () => {
      const active = chapter?.dataset.demoActive !== 'false'
      setEnabled(active)
      if (active && intersecting) entered = true
    }
    const observer = new IntersectionObserver(entries => {
      intersecting = entries[0]?.isIntersecting ?? false
      setVisible(intersecting)
      if (intersecting && chapter?.dataset.demoActive !== 'false') entered = true
      if (!intersecting && entered) setElapsed(duration)
    }, { threshold: 0.15 })
    observer.observe(node)
    visibility(); preference(); chapterChange()
    document.addEventListener('visibilitychange', visibility)
    motion.addEventListener('change', preference)
    chapter?.addEventListener('story-demo-visibility', chapterChange)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      motion.removeEventListener('change', preference)
      chapter?.removeEventListener('story-demo-visibility', chapterChange)
      if (timeout.current) clearTimeout(timeout.current)
    }
  }, [duration])
  useEffect(() => {
    if (!playing) return
    let previous = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      const delta = Math.min(now - previous, 300)
      previous = now
      setElapsed(value => Math.min(duration, value + delta))
    }, 100)
    return () => clearInterval(timer)
  }, [playing, duration])
  const interact = () => {
    setManual(true)
    if (timeout.current) clearTimeout(timeout.current)
    if (completed || reduced || paused) return
    timeout.current = setTimeout(() => { setManual(false); timeout.current = null }, 8000)
  }
  const toggle = () => {
    if (timeout.current) clearTimeout(timeout.current)
    setManual(false)
    if (completed) { setElapsed(0); setPaused(false) }
    else setPaused(paused || manual ? false : true)
  }
  return { ref, elapsed, playing, completed, reduced, manual, paused, interact, toggle }
}
