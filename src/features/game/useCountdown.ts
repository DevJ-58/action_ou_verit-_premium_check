import { useEffect, useState } from 'react'

/** Seconds left, counting down from `seconds` since mount (remount to restart). */
export function useCountdown(seconds: number): number {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      setLeft(Math.max(0, seconds - Math.floor((Date.now() - start) / 1000)))
    }, 250)
    return () => clearInterval(id)
  }, [seconds])
  return left
}
