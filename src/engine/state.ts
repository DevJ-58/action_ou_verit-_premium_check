import { GameRuleError } from './errors'
import type { Outcome } from './scoring'
import type { CategoryId, ChallengeKind, Dare, DareSource, Player, PlayMode } from './types'

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 12

export interface GameSettings {
  mode: PlayMode
  categories: CategoryId[]
  source: DareSource
  /** Number of rounds; in a round every player plays once. 1 to 20. */
  rounds: number
  timerSeconds: 0 | 30 | 60 | 90
  maxSkips: number
  /** Only changes the animation; the draw is the same. */
  picker: 'bottle' | 'random'
}

export type Phase = 'ready' | 'spinning' | 'choosing' | 'asking' | 'challenge' | 'finished'

export interface Turn {
  answererId: string
  askerId: string
  kind: ChallengeKind | null
  dare: Dare | null
  noDareAvailable: boolean
}

export interface PlayerScore {
  done: number
  skipped: number
  points: number
  truths: number
  dares: number
}

export interface HistoryEntry {
  round: number
  answererId: string
  askerId: string
  dare: Dare
  outcome: Outcome
}

export interface GameState {
  id: string
  settings: GameSettings
  players: Player[]
  phase: Phase
  round: number
  playedThisRound: string[]
  turn: Turn | null
  bottleRotation: number
  usedDareIds: string[]
  scores: Record<string, PlayerScore>
  history: HistoryEntry[]
}

export type GameAction =
  | { type: 'SPIN' }
  | { type: 'SPIN_SETTLED' }
  | { type: 'CHOOSE_KIND'; kind: ChallengeKind }
  | { type: 'PICK_SYSTEM' }
  | { type: 'PICK_CUSTOM'; dareId: string }
  | { type: 'PICK_WRITTEN'; text: string }
  | { type: 'COMPLETE' }
  | { type: 'SKIP' }
  | { type: 'RESTART' }

export const EMPTY_SCORE: PlayerScore = { done: 0, skipped: 0, points: 0, truths: 0, dares: 0 }

export function createGame(input: {
  id: string
  settings: GameSettings
  players: Player[]
}): GameState {
  const { id, settings, players } = input
  if (players.length < MIN_PLAYERS) throw new GameRuleError('notEnoughPlayers')
  if (players.length > MAX_PLAYERS) throw new GameRuleError('tooManyPlayers')
  if (settings.categories.length === 0) throw new GameRuleError('noCategory')
  return {
    id,
    settings,
    players,
    phase: 'ready',
    round: 1,
    playedThisRound: [],
    turn: null,
    bottleRotation: 0,
    usedDareIds: [],
    scores: Object.fromEntries(players.map((p) => [p.id, { ...EMPTY_SCORE }])),
    history: [],
  }
}

export function skipsLeft(state: GameState, playerId: string): number {
  return Math.max(0, state.settings.maxSkips - (state.scores[playerId]?.skipped ?? 0))
}
