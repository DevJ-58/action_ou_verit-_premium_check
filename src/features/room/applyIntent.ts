import { systemDares } from '@/content/systemDares'
import {
  createGame,
  GameRuleError,
  reduce,
  type GameSettings,
  type Player,
  type Rng,
} from '@/engine'
import { newId } from '@/lib/id'
import { FREE_LIMITS, allowedCategories } from '@/features/premium/premium'
import { mayAct } from './authorize'
import {
  ROOM_MAX_MEMBERS,
  type Intent,
  type Live,
  type Member,
  type RoomSetup,
  type RoomState,
} from './types'

const REACTIONS_KEPT = 20

export const ROOM_DEFAULTS: Omit<GameSettings, 'categories'> = {
  mode: 'remote',
  flow: 'everyone',
  proposeSeconds: 60,
  source: 'both',
  rounds: 3,
  timerSeconds: 0,
  maxSkips: 3,
  picker: 'bottle',
  liveSeconds: 60,
}

/** Which turn a live video belongs to. */
export function turnKeyOf(game: RoomState['game']): string | null {
  return game?.turn ? `${game.round}:${game.history.length}:${game.turn.answererId}` : null
}

export function liveExpired(live: Live, now: number): boolean {
  return now - live.startedAt >= live.seconds * 1000
}

/** A live video only lasts while its turn is in the challenge. */
function withLiveChecked(room: RoomState): RoomState {
  if (!room.live) return room
  const ok = room.game?.phase === 'challenge' && turnKeyOf(room.game) === room.live.turnKey
  return ok ? room : { ...room, live: null }
}

function setLive(room: RoomState, from: string, on: boolean): RoomState | null {
  const game = room.game
  if (!on) {
    if (!room.live || (from !== room.live.by && from !== room.hostId)) return null
    return { ...room, live: null }
  }
  const seconds = game?.settings.liveSeconds ?? 0
  if (!game || game.phase !== 'challenge' || game.turn?.answererId !== from || seconds <= 0)
    return null
  const live: Live = { by: from, turnKey: turnKeyOf(game)!, seconds, startedAt: Date.now() }
  return { ...room, live }
}

/** Removes a member from the room and, if a game is on, from the game (their turn ends). */
export function withoutMember(room: RoomState, memberId: string, rng: Rng): RoomState {
  const members = room.members.filter((m) => m.id !== memberId)
  const game = room.game
    ? reduce(room.game, { type: 'REMOVE_PLAYER', playerId: memberId }, { rng, systemDares })
    : null
  return withLiveChecked({ ...room, members, game })
}

export function toPlayer(member: Member): Player {
  return {
    id: member.id,
    name: member.pseudo,
    avatar: member.avatarId,
    limits: member.limits,
    customDares: member.customDares,
  }
}

/** Premium is shared by the host with the whole room. */
export function roomIsPremium(room: RoomState): boolean {
  return room.members.find((m) => m.id === room.hostId)?.premium === true
}

export function roomCapacity(room: RoomState): number {
  return roomIsPremium(room) ? ROOM_MAX_MEMBERS : FREE_LIMITS.roomMembers
}

function startGame(room: RoomState, setup: RoomSetup): RoomState | null {
  const premium = roomIsPremium(room)
  const allowed = allowedCategories(premium)
  if (setup.categories.some((c) => !allowed.includes(c))) return null
  try {
    const settings: GameSettings = {
      ...ROOM_DEFAULTS,
      ...setup,
      mode: 'remote',
      flow: 'everyone',
      liveSeconds: premium ? (setup.liveSeconds ?? ROOM_DEFAULTS.liveSeconds) : 0,
    }
    const game = createGame({ id: newId('game'), settings, players: room.members.map(toPlayer) })
    return { ...room, status: 'playing', game }
  } catch (error) {
    if (error instanceof GameRuleError) return null
    throw error
  }
}

/**
 * Host side: the next room state after an intent, or null when the intent is
 * refused (wrong sender, wrong phase, broken rule). Never throws on bad input.
 */
export function applyIntent(room: RoomState, intent: Intent, rng: Rng): RoomState | null {
  // Everything but joining requires the sender to be in the room.
  if (intent.type !== 'join' && !room.members.some((m) => m.id === intent.from)) return null
  switch (intent.type) {
    case 'join': {
      if (room.members.some((m) => m.id === intent.member.id)) return null
      if (room.status !== 'lobby' || room.members.length >= roomCapacity(room)) return null
      return { ...room, members: [...room.members, intent.member] }
    }
    case 'leave':
      return withoutMember(room, intent.from, rng)
    case 'start':
      if (intent.from !== room.hostId || room.status !== 'lobby') return null
      return startGame(room, intent.setup)
    case 'react': {
      const reaction = { id: intent.id, from: intent.from, emoji: intent.emoji, at: Date.now() }
      return { ...room, reactions: [...room.reactions, reaction].slice(-REACTIONS_KEPT) }
    }
    case 'live':
      return setLive(room, intent.from, intent.on)
    case 'action': {
      const { game } = room
      if (!game || !mayAct(game, room.hostId, intent.from, intent.action)) return null
      try {
        const next = reduce(game, intent.action, { rng, systemDares })
        const lastGame =
          intent.action.type === 'RESTART'
            ? { id: game.id, phase: game.phase, scores: game.scores }
            : room.lastGame
        return withLiveChecked({ ...room, game: next, ...(lastGame ? { lastGame } : {}) })
      } catch (error) {
        if (error instanceof GameRuleError) return null
        throw error
      }
    }
  }
}
