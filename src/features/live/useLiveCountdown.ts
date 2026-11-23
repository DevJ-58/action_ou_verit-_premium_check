import { useEffect, useState } from 'react'
import type { Live } from '@/features/room/types'

const receivedAt = new Map<string, number>()

/**
 * Seconds left in a live video, counted from when this phone learnt about it
 * (phone clocks differ; the host stops it anyway).
 */
export function useLiveCountdown(live: Live): number {
  const [start] = useState(() => {
    const key = `${live.turnKey}:${live.startedAt}`
    if (!receivedAt.has(key)) receivedAt.set(key, Date.now())
    return receivedAt.get(key)!
  })
  const [seconds, setSeconds] = useState(live.seconds)
  useEffect(() => {
    const tick = () =>
      setSeconds(Math.max(0, Math.ceil(live.seconds - (Date.now() - start) / 1000)))
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [start, live.seconds])
  return seconds
}
