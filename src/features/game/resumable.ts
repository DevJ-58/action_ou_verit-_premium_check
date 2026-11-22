import { safeStorage } from '@/lib/safeStorage'
import { isValidGame } from './validateGame'

/**
 * Whether a persisted game can be resumed. Reads storage directly so the home
 * screen does not pull the whole game engine and deck into the initial bundle.
 */
export function hasResumableGame(): boolean {
  try {
    const raw = safeStorage.getItem('av:game')
    if (typeof raw !== 'string') return false
    const game = (JSON.parse(raw) as { state?: { game?: unknown } }).state?.game
    return isValidGame(game) && game.phase !== 'finished'
  } catch {
    return false
  }
}
