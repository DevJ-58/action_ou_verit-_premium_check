import { pickIndex } from './rng'
import type { CategoryId, ChallengeKind, Dare, PlayMode, PlayerLimits, Rng } from './types'

export interface DrawFilter {
  kind: ChallengeKind
  mode: PlayMode
  /** Categories chosen for this game. */
  categories: CategoryId[]
  /** Limits of the player who must answer. */
  limits: PlayerLimits
  usedIds: ReadonlySet<string>
}

export const WRITTEN_DARE_MIN = 3
export const WRITTEN_DARE_MAX = 280

/** Whether a dare may be given to this player in this game (ignoring repeats). */
export function isAllowedFor(dare: Dare, filter: Omit<DrawFilter, 'usedIds'>): boolean {
  return (
    dare.kind === filter.kind &&
    dare.modes.includes(filter.mode) &&
    filter.categories.includes(dare.category) &&
    !filter.limits.excludedCategories.includes(dare.category) &&
    dare.intensity <= filter.limits.maxIntensity
  )
}

/**
 * Draws a dare the player is allowed to receive, preferring ones not played yet.
 * When every allowed dare was already played, repeats are allowed again.
 * Returns null when no dare at all fits the player's limits.
 */
export function drawDare(pool: readonly Dare[], filter: DrawFilter, rng: Rng): Dare | null {
  const allowed = pool.filter((dare) => isAllowedFor(dare, filter))
  const fresh = allowed.filter((dare) => !filter.usedIds.has(dare.id))
  const candidates = fresh.length > 0 ? fresh : allowed
  if (candidates.length === 0) return null
  return candidates[pickIndex(candidates.length, rng)] ?? null
}

export type WrittenDareResult =
  { ok: true; text: string } | { ok: false; reason: 'tooShort' | 'tooLong' }

/** Validates a dare typed during the game by the asking player. */
export function validateWrittenDare(text: string): WrittenDareResult {
  const trimmed = text.trim()
  if (trimmed.length < WRITTEN_DARE_MIN) return { ok: false, reason: 'tooShort' }
  if (trimmed.length > WRITTEN_DARE_MAX) return { ok: false, reason: 'tooLong' }
  return { ok: true, text: trimmed }
}
