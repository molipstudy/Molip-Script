import { useEffect } from 'react'
import type { RefObject } from 'react'
import { clampUnit, frameStyle, nextRevealProgress, retainProgress } from '../model/story'

export function useScrollStory(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = root.current
    if (!element) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const tracks = Array.from(element.querySelectorAll<HTMLElement>('[data-story-track]'))
    let frame = 0
    const revealed = new WeakMap<HTMLElement, number>()
    const queued = new WeakMap<HTMLElement, number>()
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
        const contentHeight = (track.querySelector<HTMLElement>('.story-frames')?.offsetHeight ?? 0) + (stage?.offsetHeight ?? 0) + (track.querySelector<HTMLElement>('.story-chapter-cue')?.offsetHeight ?? 0) + 96
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
    const followCue = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('.story-chapter-cue, .story-scroll-cue')
        : null
      const href = link?.getAttribute('href')
      let target = href?.startsWith('#') ? document.getElementById(href.slice(1)) : null
      if (!target || !element.contains(target)) return
      event.preventDefault()
      const currentTrack = link?.closest<HTMLElement>('[data-story-track]')
      let nextProgress = 0
      if (currentTrack && currentTrack.dataset.flow !== 'true' && !motion.matches) {
        const count = currentTrack.querySelectorAll('.story-frame, .story-demo-stage').length
        const next = nextRevealProgress(Math.max(revealed.get(currentTrack) ?? 0, queued.get(currentTrack) ?? 0), count)
        if (next !== null) { target = currentTrack; nextProgress = next; queued.set(currentTrack, next) }
      }
      const sticky = target.querySelector<HTMLElement>('.story-sticky')
      const inset = window.innerWidth <= 820 ? 64 : 0
      const revealDistance = sticky && target.dataset.flow !== 'true' && !motion.matches
        ? Math.max(0, target.offsetHeight - sticky.offsetHeight) * nextProgress
        : 0
      const top = window.scrollY + target.getBoundingClientRect().top - inset + revealDistance
      schedule()
      // Native scrolling drives exactly the same reveal logic as wheel and touch scrolling.
      window.scrollTo({ top, behavior: motion.matches ? 'instant' : 'smooth' })
    }
    element.addEventListener('click', followCue)
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
      element.removeEventListener('click', followCue)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      motion.removeEventListener('change', schedule)
      delete element.dataset.scrollReady
      tracks.forEach(track => setDemo(track, true))
    }
  }, [root])
}
