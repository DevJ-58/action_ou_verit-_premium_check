import { MAX_PLAYERS, MIN_PLAYERS, type GameState } from '@/engine/state'

const PHASES = new Set([
  'ready',
  'spinning',
  'choosing',
  'asking',
  'proposing',
  'picking',
  'challenge',
  'finished',
])
const NEEDS_TURN = new Set(['spinning', 'choosing', 'asking', 'proposing', 'picking', 'challenge'])

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

/** Shape check for a saved game, so a damaged save is dropped instead of crashing the table. */
export function isValidGame(value: unknown): value is GameState {
  if (!isObject(value) || typeof value.id !== 'string' || !PHASES.has(value.phase as string))
    return false
  const { players, settings, scores, turn } = value
  if (!Array.isArray(players) || players.length < MIN_PLAYERS || players.length > MAX_PLAYERS)
    return false
  const ids = new Set<string>()
  for (const p of players) {
    if (!isObject(p) || typeof p.id !== 'string' || typeof p.name !== 'string') return false
    if (!isObject(p.limits) || !Array.isArray(p.customDares)) return false
    ids.add(p.id)
  }
  if (
    !isObject(settings) ||
    !Array.isArray(settings.categories) ||
    settings.categories.length === 0
  )
    return false
  if (!isObject(scores) || [...ids].some((id) => !isObject(scores[id]))) return false
  if (
    !Array.isArray(value.history) ||
    !Array.isArray(value.usedDareIds) ||
    !Array.isArray(value.playedThisRound)
  ) {
    return false
  }
  if (turn === null) return !NEEDS_TURN.has(value.phase as string)
  if (!isObject(turn) || !ids.has(turn.answererId as string) || !ids.has(turn.askerId as string))
    return false
  if (value.phase === 'challenge' && !isObject(turn.dare)) return false
  return true
}
