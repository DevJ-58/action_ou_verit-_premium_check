import { safeStorage } from '@/lib/safeStorage'

/**
 * Whether a persisted game can be resumed. Reads storage directly so the home
 * screen does not pull the whole game engine and deck into the initial bundle.
 */
export function hasResumableGame(): boolean {
  try {
    const raw = safeStorage.getItem('av:game')
    if (typeof raw !== 'string') return false
    const phase = (JSON.parse(raw) as { state?: { game?: { phase?: string } | null } }).state?.game
      ?.phase
    return phase !== undefined && phase !== 'finished'
  } catch {
    return false
  }
}
