import { useEffect, useMemo, useState } from 'react'

interface ViewportMode {
  width: number
  height: number
  ratio: number
  isDesktop: boolean
  isMobile: boolean
}

const getViewport = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 }
  }
  return { width: window.innerWidth, height: window.innerHeight || 1 }
}

export function useViewportMode(): ViewportMode {
  const [viewport, setViewport] = useState(getViewport)

  useEffect(() => {
    const onResize = () => setViewport(getViewport())
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  return useMemo(() => {
    const width = viewport.width
    const height = viewport.height || 1
    const ratio = width / height
    const isDesktop = width >= 1024 && ratio >= 1
    return {
      width,
      height,
      ratio,
      isDesktop,
      isMobile: !isDesktop,
    }
  }, [viewport.width, viewport.height])
}
