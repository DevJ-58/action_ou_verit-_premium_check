import { useEffect } from 'react'
import { feedback } from '@/lib/feedback'

/**
 * When the bottle passes each “notch” while it spins: the spin eases out (fast, then slow),
 * so the ticks come quickly at first and space out until it stops.
 */
export function spinTickTimes(durationMs: number, notches = 36): number[] {
  const times: number[] = []
  // Position follows 1 - (1 - t)^3 (ease out); find when each notch is reached.
  for (let k = 1; k <= notches; k++) {
    const progress = k / (notches + 1)
    const t = 1 - Math.cbrt(1 - progress)
    times.push(Math.round(t * durationMs))
  }
  return times
}

/** Plays the ticking of the bottle while it spins (sound and a light vibration). */
export function useSpinTicks(spinning: boolean, durationMs: number): void {
  useEffect(() => {
    if (!spinning) return
    const timers = spinTickTimes(durationMs).map((at) => setTimeout(() => feedback.spinTick(), at))
    return () => timers.forEach(clearTimeout)
  }, [spinning, durationMs])
}
