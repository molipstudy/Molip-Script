import { useEffect } from 'react'
import type { RefObject } from 'react'
import { clampUnit, frameStyle, retainProgress } from '../model/story'

export function useScrollStory(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = root.current
    if (!element) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const tracks = Array.from(element.querySelectorAll<HTMLElement>('[data-story-track]'))
    let frame = 0
    const revealed = new WeakMap<HTMLElement, number>()
    const setDemo = (track: HTMLElement, active: boolean) => {
      const value = String(active)
      const stage = track.querySelector<HTMLElement>('.story-demo-stage')
      if (stage) stage.inert = !active
      if (track.dataset.demoActive === value) return
      track.dataset.demoActive = value
      track.dispatchEvent(new Event('story-demo-visibility'))
    }
    const update = () => {
      frame = 0
      const reduced = motion.matches
      element.dataset.scrollReady = String(!reduced)
      // Read every geometry first; write transforms and opacity afterwards.
      const geometry = tracks.map(track => ({ track, box: track.getBoundingClientRect(), sticky: track.querySelector<HTMLElement>('.story-sticky') }))
      for (const { track, box, sticky } of geometry) {
        if (!sticky) continue
        const frames = Array.from(track.querySelectorAll<HTMLElement>('.story-frame'))
        const stage = track.querySelector<HTMLElement>('.story-demo-stage')
        const count = frames.length + (stage ? 1 : 0)
        const top = window.innerWidth <= 820 ? 64 : 0
        const bottom = window.innerWidth <= 820 ? 96 : 24
        const contentHeight = (track.querySelector<HTMLElement>('.story-frames')?.offsetHeight ?? 0) + (stage?.offsetHeight ?? 0) + 24
        const flow = Boolean(stage && contentHeight > window.innerHeight - top - bottom)
        track.dataset.flow = String(flow)
        const current = clampUnit((top - box.top) / Math.max(1, box.height - sticky.offsetHeight))
        const progress = flow ? 1 : retainProgress(revealed.get(track) ?? 0, current)
        revealed.set(track, reduced ? 1 : progress)
        frames.forEach((node, index) => {
          const state = frameStyle(progress, index, count)
          node.style.setProperty('--frame-opacity', String(reduced ? 1 : state.opacity))
          node.style.setProperty('--frame-y', `${reduced ? 0 : state.y}px`)
        })
        if (stage) {
          const state = frameStyle(progress, count - 1, count)
          stage.style.setProperty('--frame-opacity', String(reduced ? 1 : state.opacity))
          stage.style.setProperty('--frame-y', `${reduced ? 0 : state.y}px`)
          setDemo(track, reduced || state.opacity > 0.12)
        }
      }

    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    tracks.forEach(track => { const sticky = track.querySelector('.story-sticky'); if (sticky) observer.observe(sticky) })
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    motion.addEventListener('change', schedule)
    schedule()
    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      motion.removeEventListener('change', schedule)
      delete element.dataset.scrollReady
      tracks.forEach(track => setDemo(track, true))
    }
  }, [root])
}
