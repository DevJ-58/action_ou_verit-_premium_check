import type { SupabaseClient } from '@supabase/supabase-js'
import type { Bus } from '@/features/room/bus'
import { newId } from '@/lib/id'

/** Who is online in the app (signed-in players with the app open). */
export interface PresenceService {
  /** Announces this player as online until the returned function is called. */
  track(selfId: string): () => void
  onOnline(listener: (online: ReadonlySet<string>) => void): () => void
  /** Tests: stop beating without saying goodbye (app killed). */
  silence(): void
}

/** Between tabs of one browser: heartbeats on the bus, offline after 3 missed beats. */
export function createLocalPresence(
  bus: Bus,
  options: { heartbeatMs?: number } = {},
): PresenceService {
  const beatMs = options.heartbeatMs ?? 4000
  const origin = newId('presence')
  let beat: ReturnType<typeof setInterval> | null = null
  return {
    track(selfId) {
      const send = () => bus.publish({ kind: 'online', code: 'app', memberId: selfId, origin })
      send()
      beat = setInterval(send, beatMs)
      return () => {
        if (beat) clearInterval(beat)
        beat = null
        bus.publish({ kind: 'bye', code: 'app', memberId: selfId, origin })
      }
    },
    onOnline(listener) {
      const seen = new Map<string, number>()
      let last = ''
      const emit = () => {
        const now = Date.now()
        const ids = [...seen].filter(([, at]) => now - at < beatMs * 3).map(([id]) => id)
        const key = ids.sort().join(',')
        if (key !== last) {
          last = key
          listener(new Set(ids))
        }
      }
      const off = bus.subscribe((m) => {
        if (m.code !== 'app') return
        if (m.kind === 'online') seen.set(m.memberId, Date.now())
        else if (m.kind === 'bye') seen.delete(m.memberId)
        else return
        emit()
      })
      const timer = setInterval(emit, beatMs)
      return () => {
        off()
        clearInterval(timer)
      }
    },
    silence() {
      if (beat) clearInterval(beat)
      beat = null
    },
  }
}

/** Over Supabase Realtime presence on the channel "online" (only player ids are shared). */
export function createSupabasePresence(getClient: () => Promise<SupabaseClient>): PresenceService {
  const listeners = new Set<(online: ReadonlySet<string>) => void>()
  let current: ReadonlySet<string> = new Set()
  const channel = getClient().then((client) => {
    const ch = client.channel('online', { config: { presence: { key: newId('device') } } })
    ch.on('presence', { event: 'sync' }, () => {
      const metas = Object.values(ch.presenceState()).flat() as unknown as { id?: string }[]
      current = new Set(metas.map((m) => m.id).filter((id): id is string => Boolean(id)))
      listeners.forEach((l) => l(current))
    })
    return new Promise<typeof ch>((resolve) =>
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve(ch)
      }),
    )
  })
  return {
    track(selfId) {
      void channel.then((ch) => ch.track({ id: selfId }))
      return () => void channel.then((ch) => ch.untrack())
    },
    onOnline(listener) {
      listeners.add(listener)
      listener(current)
      return () => {
        listeners.delete(listener)
      }
    },
    silence() {},
  }
}
