import type { EmojiName } from '@/content/emoji'
import type { ChatMessage } from '@/features/chat/types'
import type { Invite } from '@/features/friends/invites'
import type { Signal } from '@/features/live/types'
import type { Dare, GameAction, GameSettings, GameState, PlayerLimits } from '@/engine'

/** A player in a room: the public part of their profile. */
export interface Member {
  id: string
  pseudo: string
  avatarId: string
  limits: PlayerLimits
  customDares: Dare[]
  /** Premium player: as host, unlocks Premium for the whole room. */
  premium?: boolean
}

export interface Reaction {
  id: string
  from: string
  emoji: EmojiName
  at: number
}

/** Everything every phone in the room must agree on. Only the host writes it. */
export interface RoomState {
  code: string
  /** Increases on every host change; older states are ignored. */
  version: number
  hostId: string
  status: 'lobby' | 'playing'
  members: Member[]
  game: GameState | null
  reactions: Reaction[]
  /** The designated player is filming the challenge, live. */
  live?: Live | null
  /** Result of the previous game (kept on replay, so phones that missed its end still count it). */
  lastGame?: Pick<GameState, 'id' | 'phase' | 'scores'> | null
}

export interface Live {
  by: string
  /** Which turn it belongs to (round and answerer). */
  turnKey: string
  seconds: number
  /** Host clock, milliseconds. */
  startedAt: number
}

export type RoomSetup = Pick<GameSettings, 'categories'> & Partial<GameSettings>

export type Intent = { id: string; from: string } & (
  | { type: 'join'; member: Member }
  | { type: 'leave' }
  | { type: 'start'; setup: RoomSetup }
  | { type: 'action'; action: GameAction }
  | { type: 'react'; emoji: EmojiName }
  | { type: 'live'; on: boolean }
)

/** An intent without the id and sender, which the room store fills in. */
export type IntentBody = Intent extends infer I
  ? I extends Intent
    ? Omit<I, 'id' | 'from'>
    : never
  : never

export type BusMessage =
  | { kind: 'state'; code: string; state: RoomState; origin?: string }
  | { kind: 'intent'; code: string; intent: Intent; origin?: string }
  | { kind: 'presence'; code: string; memberId: string; origin?: string }
  | { kind: 'bye'; code: string; memberId: string; origin?: string }
  | { kind: 'chat'; code: string; message: ChatMessage; origin?: string }
  | { kind: 'invite'; code: string; invite: Invite; origin?: string }
  | { kind: 'signal'; code: string; signal: Signal; origin?: string }

export type RoomError = 'roomNotFound' | 'roomFull' | 'roomStarted' | 'joinTimeout'

export const ROOM_MAX_MEMBERS = 12
