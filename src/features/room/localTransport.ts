import { newId } from '@/lib/id'
import type { Bus } from './bus'
import type { Intent, RoomState } from './types'

/** How a phone talks to its room, whatever carries the messages. */
export interface RoomTransport {
  readSnapshot(code: string): Promise<RoomState | null>
  publishState(state: RoomState): void
  /** A guest takes over hosting (the host vanished); the backend may check it is allowed. */
  claimHost(state: RoomState): Promise<boolean>
  /** Host only: says "still here" so nobody may take over while the host is idle. */
  touch(code: string): void
  sendIntent(code: string, intent: Intent): void
  onState(code: string, listener: (state: RoomState) => void): () => void
  onIntent(code: string, listener: (intent: Intent) => void): () => void
  /** Announces this member as online until the returned function is called (with a goodbye unless `silent`). */
  track(code: string, memberId: string): (silent?: boolean) => void
  /** Who is online in the room (this phone included once tracked). */
  onPresence(code: string, listener: (online: ReadonlySet<string>) => void): () => void
}

/** Transport over a local bus (tabs of one browser, or memory in tests). */
export function createLocalTransport(
  bus: Bus,
  options: { heartbeatMs?: number } = {},
): RoomTransport {
  const origin = newId('tab')
  const heartbeatMs = options.heartbeatMs ?? 2000
  const tracked = new Map<string, string>()

  const publishState = (state: RoomState) => {
    bus.writeSnapshot(state)
    bus.publish({ kind: 'state', code: state.code, state, origin })
  }

  return {
    readSnapshot: async (code) => bus.readSnapshot(code),
    publishState,
    claimHost: async (state) => {
      publishState(state)
      return true
    },
    touch: () => {},
    sendIntent: (code, intent) => bus.publish({ kind: 'intent', code, intent, origin }),
    onState: (code, listener) =>
      bus.subscribe((m) => {
        if (m.kind === 'state' && m.code === code && m.origin !== origin) listener(m.state)
      }),
    onIntent: (code, listener) =>
      bus.subscribe((m) => {
        if (m.kind === 'intent' && m.code === code && m.origin !== origin) listener(m.intent)
      }),
    track: (code, memberId) => {
      tracked.set(code, memberId)
      const beat = () => bus.publish({ kind: 'presence', code, memberId, origin })
      beat()
      const id = setInterval(beat, heartbeatMs)
      return (silent = false) => {
        clearInterval(id)
        tracked.delete(code)
        if (!silent) bus.publish({ kind: 'bye', code, memberId, origin })
      }
    },
    onPresence: (code, listener) => {
      const lastSeen = new Map<string, number>()
      let current = ''
      const emit = () => {
        const now = Date.now()
        const online = new Set(
          [...lastSeen].filter(([, at]) => now - at < heartbeatMs * 3).map(([id]) => id),
        )
        const self = tracked.get(code)
        if (self) online.add(self)
        const key = [...online].sort().join(',')
        if (key !== current) {
          current = key
          listener(online)
        }
      }
      const off = bus.subscribe((m) => {
        if (m.code !== code || m.origin === origin) return
        if (m.kind === 'presence') lastSeen.set(m.memberId, Date.now())
        else if (m.kind === 'bye') lastSeen.delete(m.memberId)
        else return
        emit()
      })
      const id = setInterval(emit, heartbeatMs)
      emit()
      return () => {
        off()
        clearInterval(id)
      }
    },
  }
}
