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
  /** 'asker' (one phone): one player sets the dare. 'everyone' (rooms): every other player proposes one. */
  flow?: 'asker' | 'everyone'
  /** Time given to propose in the 'everyone' flow. */
  proposeSeconds?: 30 | 60 | 90
}

export type Phase =
  'ready' | 'spinning' | 'choosing' | 'asking' | 'proposing' | 'picking' | 'challenge' | 'finished'

export interface Turn {
  answererId: string
  askerId: string
  kind: ChallengeKind | null
  dare: Dare | null
  noDareAvailable: boolean
  /** 'everyone' flow: one proposal per other player (shuffled when proposals close). */
  proposals?: Proposal[]
  /** Set by the designated player while the challenge is on (rooms). */
  answer?: Answer
  /** Other players' verdicts on the answer, by player id (true = convinced). */
  votes?: Record<string, boolean>
}

export interface Answer {
  text?: string
  voiceId?: string
  /** Length of the voice answer in milliseconds. */
  voiceMs?: number
}

export interface Proposal {
  playerId: string
  dare: Dare
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
  answer?: Answer
  votes?: Record<string, boolean>
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
  | { type: 'PROPOSE'; playerId: string; dare: Dare }
  | { type: 'CLOSE_PROPOSALS' }
  | { type: 'PICK_PROPOSAL'; index: number }
  | { type: 'TIMEOUT_PICK' }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'TIMEOUT_CHOOSE' }
  | { type: 'ANSWER'; playerId: string; text?: string; voiceId?: string; voiceMs?: number }
  | { type: 'VOTE'; playerId: string; ok: boolean }

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
