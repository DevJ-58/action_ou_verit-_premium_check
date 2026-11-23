import { createStore, type StoreApi } from 'zustand/vanilla'
import type { EmojiName } from '@/content/emoji'
import type { GameAction, Rng } from '@/engine'
import { newId } from '@/lib/id'
import { applyIntent, roomCapacity, withoutMember } from './applyIntent'
import type { RoomTransport } from './localTransport'
import { generateRoomCode } from './roomCode'
import {
  type Intent,
  type IntentBody,
  type Member,
  type RoomError,
  type RoomSetup,
  type RoomState,
} from './types'

export interface RoomTiming {
  /** How long the host may be offline before the next present member takes over. */
  hostAbsentMs: number
  /** How long a guest waits for the host to accept them. */
  joinTimeoutMs: number
}

export const DEFAULT_TIMING: RoomTiming = { hostAbsentMs: 8000, joinTimeoutMs: 8000 }

export interface RoomStoreState {
  self: Member
  room: RoomState | null
  role: 'host' | 'guest' | null
  /** Ids of the members currently online. */
  online: ReadonlySet<string>
  createRoom(): Promise<string>
  joinRoom(code: string): Promise<RoomError | null>
  start(setup: RoomSetup): Promise<void>
  act(action: GameAction): void
  react(emoji: EmojiName): void
  /** Starts or stops the live video of the challenge. */
  setLive(on: boolean): void
  /** Leaves for good (others are told). */
  leave(): void
  /** Stops talking to the room without leaving (app closed, phone locked). */
  disconnect(): void
}

export type RoomStore = StoreApi<RoomStoreState>

export function createRoomStore(deps: {
  transport: RoomTransport
  self: Member
  rng: Rng
  timing?: Partial<RoomTiming>
}): RoomStore {
  const { transport, self, rng } = deps
  const timing = { ...DEFAULT_TIMING, ...deps.timing }
  const seen = new Set<string>()
  let cleanup: (() => void) | null = null
  let stopTracking: ((silent?: boolean) => void) | null = null
  let hostWatch: ReturnType<typeof setTimeout> | null = null

  return createStore<RoomStoreState>()((set, get, storeApi) => {
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

    /** If the host has gone quiet, the first present member (in join order) takes over. */
    function watchHost() {
      if (hostWatch) clearTimeout(hostWatch)
      hostWatch = null
      const { room, online } = get()
      if (!room || online.has(room.hostId)) return
      hostWatch = setTimeout(() => {
        const current = get()
        const r = current.room
        if (!r || current.online.has(r.hostId)) return
        const successor = r.members.find((m) => m.id !== r.hostId && current.online.has(m.id))
        if (successor?.id !== self.id) return
        // Jump the version so no late state from the old host can win.
        const taken = { ...r, hostId: self.id, version: r.version + 10 }
        set({ room: taken, role: 'host' })
        void transport.claimHost(taken)
      }, timing.hostAbsentMs)
    }

    function listen(code: string) {
      cleanup?.()
      const offState = transport.onState(code, (state) => {
        const current = get().room
        if (current && state.version <= current.version) return
        set({ room: state, role: roleFor(state) })
        watchHost()
      })
      const offIntent = transport.onIntent(code, handle)
      const offPresence = transport.onPresence(code, (online) => {
        set({ online })
        watchHost()
      })
      stopTracking = transport.track(code, self.id)
      const heartbeat = setInterval(() => {
        if (get().role === 'host') transport.touch(code)
      }, 5000)
      cleanup = () => {
        clearInterval(heartbeat)
        offState()
        offIntent()
        offPresence()
        if (hostWatch) clearTimeout(hostWatch)
      }
    }

    function stop(sayGoodbye: boolean) {
      cleanup?.()
      cleanup = null
      stopTracking?.(!sayGoodbye)
      stopTracking = null
      set({ room: null, role: null, online: new Set() })
    }

    function send(intent: IntentBody) {
      const full = { ...intent, id: newId('intent'), from: self.id } as Intent
      const { room, role } = get()
      if (!room) return
      if (role === 'host') handle(full)
      else transport.sendIntent(room.code, full)
    }

    function waitUntilMember(): Promise<boolean> {
      return new Promise((resolve) => {
        const deadline = setTimeout(() => {
          off()
          resolve(false)
        }, timing.joinTimeoutMs)
        const isIn = () => get().room?.members.some((m) => m.id === self.id) ?? false
        const off = storeApi.subscribe(() => {
          if (!isIn()) return
          clearTimeout(deadline)
          off()
          resolve(true)
        })
      })
    }

    return {
      self,
      room: null,
      role: null,
      online: new Set(),
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
        if (!already && snapshot.members.length >= roomCapacity(snapshot)) return 'roomFull'
        listen(code)
        set({ room: snapshot, role: roleFor(snapshot) })
        if (already) return null
        const accepted = waitUntilMember()
        send({ type: 'join', member: self })
        if (await accepted) return null
        stop(true)
        return 'joinTimeout'
      },
      start: async (setup) => send({ type: 'start', setup }),
      act: (action) => send({ type: 'action', action }),
      react: (emoji) => send({ type: 'react', emoji }),
      setLive: (on) => send({ type: 'live', on }),
      leave: () => {
        const { room, role } = get()
        if (room && role === 'host') {
          const next = room.members.find((m) => m.id !== self.id)
          if (next) commit({ ...withoutMember(room, self.id, rng), hostId: next.id })
        } else if (room) {
          send({ type: 'leave' })
        }
        stop(true)
      },
      disconnect: () => stop(false),
    }
  })
}
