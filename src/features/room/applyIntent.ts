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
import { mayAct } from './authorize'
import { ROOM_MAX_MEMBERS, type Intent, type Member, type RoomSetup, type RoomState } from './types'

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

function startGame(room: RoomState, setup: RoomSetup): RoomState | null {
  try {
    const settings: GameSettings = { ...ROOM_DEFAULTS, ...setup, mode: 'remote', flow: 'everyone' }
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
  switch (intent.type) {
    case 'join': {
      if (room.members.some((m) => m.id === intent.member.id)) return null
      if (room.status !== 'lobby' || room.members.length >= ROOM_MAX_MEMBERS) return null
      return { ...room, members: [...room.members, intent.member] }
    }
    case 'leave':
      if (!room.members.some((m) => m.id === intent.from)) return null
      return { ...room, members: room.members.filter((m) => m.id !== intent.from) }
    case 'start':
      if (intent.from !== room.hostId || room.status !== 'lobby') return null
      return startGame(room, intent.setup)
    case 'react': {
      const reaction = { id: intent.id, from: intent.from, emoji: intent.emoji, at: Date.now() }
      return { ...room, reactions: [...room.reactions, reaction].slice(-REACTIONS_KEPT) }
    }
    case 'action': {
      const { game } = room
      if (!game || !mayAct(game, room.hostId, intent.from, intent.action)) return null
      try {
        return { ...room, game: reduce(game, intent.action, { rng, systemDares }) }
      } catch (error) {
        if (error instanceof GameRuleError) return null
        throw error
      }
    }
  }
}
