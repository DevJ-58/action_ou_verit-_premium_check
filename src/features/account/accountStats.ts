import type { GameState } from '@/engine'

/** What a player did across all their games, kept in their profile. */
export interface AccountStats {
  games: number
  wins: number
  truths: number
  dares: number
  skipped: number
  points: number
  /** Last games already counted, so a game is never counted twice. */
  gameIds: string[]
}

export const EMPTY_ACCOUNT_STATS: AccountStats = {
  games: 0,
  wins: 0,
  truths: 0,
  dares: 0,
  skipped: 0,
  points: 0,
  gameIds: [],
}

const KEPT_IDS = 50
const COUNTERS = ['games', 'wins', 'truths', 'dares', 'skipped', 'points'] as const

/** Adds a finished game to the stats of one player (unchanged if already counted). */
export function recordAccountGame(
  stats: AccountStats,
  game: GameState,
  playerId: string,
): AccountStats {
  const score = game.scores[playerId]
  if (game.phase !== 'finished' || !score || stats.gameIds.includes(game.id)) return stats
  const best = Math.max(...Object.values(game.scores).map((s) => s.points))
  return {
    games: stats.games + 1,
    wins: stats.wins + (score.points === best && best > 0 ? 1 : 0),
    truths: stats.truths + score.truths,
    dares: stats.dares + score.dares,
    skipped: stats.skipped + score.skipped,
    points: stats.points + score.points,
    gameIds: [...stats.gameIds, game.id].slice(-KEPT_IDS),
  }
}

/** Reads saved stats of any shape; unknown or broken values fall back to zero. */
export function sanitizeStats(raw: unknown): AccountStats {
  if (typeof raw !== 'object' || raw === null) return EMPTY_ACCOUNT_STATS
  const r = raw as Record<string, unknown>
  const out: AccountStats = { ...EMPTY_ACCOUNT_STATS }
  for (const key of COUNTERS) {
    const value = r[key]
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) out[key] = value
  }
  if (Array.isArray(r.gameIds)) out.gameIds = r.gameIds.filter((id) => typeof id === 'string')
  return out
}
