import type { GameState, PlayerScore } from '@/engine'

export type Award = 'winner' | 'bravest' | 'truthKing' | 'escapeArtist'

const RULES: ReadonlyArray<{ award: Award; value: (s: PlayerScore) => number; min: number }> = [
  { award: 'winner', value: (s) => s.points, min: -Infinity },
  { award: 'bravest', value: (s) => s.dares, min: 1 },
  { award: 'truthKing', value: (s) => s.truths, min: 1 },
  { award: 'escapeArtist', value: (s) => s.skipped, min: 1 },
]

/** End-of-game titles; ties go to the first player in seat order. */
export function computeAwards(state: GameState): { award: Award; playerId: string }[] {
  return RULES.flatMap(({ award, value, min }) => {
    let best: { playerId: string; score: number } | null = null
    for (const player of state.players) {
      const score = value(state.scores[player.id]!)
      if (score >= min && (best === null || score > best.score))
        best = { playerId: player.id, score }
    }
    return best ? [{ award, playerId: best.playerId }] : []
  })
}
