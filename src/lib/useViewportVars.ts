import { useEffect } from 'react'

/**
 * Publishes the visible height (--vvh) and the space taken by the on-screen keyboard (--kb)
 * as CSS variables. iPhone Safari does not resize fixed panels when the keyboard opens:
 * sheets use these to stay above it.
 */
export function useViewportVars(): void {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const root = document.documentElement
    const update = () => {
      const keyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      root.style.setProperty('--vvh', `${vv.height}px`)
      root.style.setProperty('--kb', `${keyboard}px`)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])
}
