import { createStore, type StoreApi } from 'zustand/vanilla'
import type { EmojiName } from '@/content/emoji'
import type { GameAction, Rng } from '@/engine'
import { newId } from '@/lib/id'
import { applyIntent } from './applyIntent'
import type { RoomTransport } from './localTransport'
import { generateRoomCode } from './roomCode'
import {
  ROOM_MAX_MEMBERS,
  type Intent,
  type IntentBody,
  type Member,
  type RoomError,
  type RoomSetup,
  type RoomState,
} from './types'

export interface RoomStoreState {
  self: Member
  room: RoomState | null
  role: 'host' | 'guest' | null
  createRoom(): Promise<string>
  joinRoom(code: string): Promise<RoomError | null>
  start(setup: RoomSetup): Promise<void>
  act(action: GameAction): void
  react(emoji: EmojiName): void
  leave(): void
}

export type RoomStore = StoreApi<RoomStoreState>

export function createRoomStore(deps: {
  transport: RoomTransport
  self: Member
  rng: Rng
}): RoomStore {
  const { transport, self, rng } = deps
  const seen = new Set<string>()
  let unsubscribe: (() => void) | null = null

  const store = createStore<RoomStoreState>()((set, get) => {
    const roleFor = (room: RoomState) => (room.hostId === self.id ? 'host' : 'guest')

    function commit(next: RoomState) {
      const room = { ...next, version: next.version + 1 }
      set({ room, role: roleFor(room) })
      transport.publishState(room)
    }

    function handle(intent: Intent) {
      const { room, role } = get()
      if (!room || role !== 'host' || seen.has(intent.id)) return
      seen.add(intent.id)
      const next = applyIntent(room, intent, rng)
      if (next) commit(next)
    }

    function listen(code: string) {
      unsubscribe?.()
      const offState = transport.onState(code, (state) => {
        const current = get().room
        if (current && state.version <= current.version) return
        set({ room: state, role: roleFor(state) })
      })
      const offIntent = transport.onIntent(code, handle)
      unsubscribe = () => {
        offState()
        offIntent()
      }
    }

    function send(intent: IntentBody) {
      const full = { ...intent, id: newId('intent'), from: self.id } as Intent
      const { room, role } = get()
      if (!room) return
      if (role === 'host') handle(full)
      else transport.sendIntent(room.code, full)
    }

    return {
      self,
      room: null,
      role: null,
      createRoom: async () => {
        let code = generateRoomCode(rng)
        while (await transport.readSnapshot(code)) code = generateRoomCode(rng)
        listen(code)
        commit({
          code,
          version: 0,
          hostId: self.id,
          status: 'lobby',
          members: [self],
          game: null,
          reactions: [],
        })
        return code
      },
      joinRoom: async (code) => {
        const snapshot = await transport.readSnapshot(code)
        if (!snapshot) return 'roomNotFound'
        const already = snapshot.members.some((m) => m.id === self.id)
        if (!already && snapshot.status !== 'lobby') return 'roomStarted'
        if (!already && snapshot.members.length >= ROOM_MAX_MEMBERS) return 'roomFull'
        listen(code)
        set({ room: snapshot, role: roleFor(snapshot) })
        if (!already) send({ type: 'join', member: self })
        return null
      },
      start: async (setup) => send({ type: 'start', setup }),
      act: (action) => send({ type: 'action', action }),
      react: (emoji) => send({ type: 'react', emoji }),
      leave: () => {
        const { room, role } = get()
        if (room && role === 'host') {
          const next = room.members.find((m) => m.id !== self.id)
          if (next)
            commit({
              ...room,
              hostId: next.id,
              members: room.members.filter((m) => m.id !== self.id),
            })
        } else if (room) {
          send({ type: 'leave' })
        }
        unsubscribe?.()
        unsubscribe = null
        set({ room: null, role: null })
      },
    }
  })
  return store
}
