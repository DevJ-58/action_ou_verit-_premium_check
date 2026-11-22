import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import type { RoomTransport } from './localTransport'
import type { Intent, RoomState } from './types'

interface Room {
  ready: Promise<RealtimeChannel>
  states: Set<(state: RoomState) => void>
  intents: Set<(intent: Intent) => void>
}

/**
 * Rooms over Supabase: the last state is kept in the `rooms` table (join and resume),
 * live states and intents travel over Realtime broadcast on "room:<code>".
 */
export function createSupabaseTransport(getClient: () => Promise<SupabaseClient>): RoomTransport {
  const rooms = new Map<string, Room>()

  function room(code: string): Room {
    const existing = rooms.get(code)
    if (existing) return existing
    const created: Room = {
      states: new Set(),
      intents: new Set(),
      ready: null as unknown as Promise<RealtimeChannel>,
    }
    created.ready = getClient().then(
      (client) =>
        new Promise<RealtimeChannel>((resolve) => {
          const channel = client
            .channel(`room:${code}`, { config: { broadcast: { self: false } } })
            .on('broadcast', { event: 'state' }, ({ payload }) =>
              created.states.forEach((l) => l(payload as RoomState)),
            )
            .on('broadcast', { event: 'intent' }, ({ payload }) =>
              created.intents.forEach((l) => l(payload as Intent)),
            )
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') resolve(channel)
          })
        }),
    )
    rooms.set(code, created)
    return created
  }

  async function broadcast(code: string, event: 'state' | 'intent', payload: unknown) {
    const channel = await room(code).ready
    await channel.send({ type: 'broadcast', event, payload })
  }

  async function persist(state: RoomState) {
    const client = await getClient()
    const row = {
      state,
      host_id: state.hostId,
      version: state.version,
      updated_at: new Date().toISOString(),
    }
    const table = client.from('rooms')
    const { error } =
      state.version === 1
        ? await table.insert({ code: state.code, ...row })
        : await table.update(row).eq('code', state.code)
    if (error) console.error('Room save failed', error)
  }

  return {
    readSnapshot: async (code) => {
      const client = await getClient()
      const { data } = await client.from('rooms').select('state').eq('code', code).maybeSingle()
      return (data?.state as RoomState | undefined) ?? null
    },
    publishState: (state) => {
      void persist(state)
      void broadcast(state.code, 'state', state)
    },
    sendIntent: (code, intent) => void broadcast(code, 'intent', intent),
    onState: (code, listener) => {
      const r = room(code)
      r.states.add(listener)
      return () => r.states.delete(listener)
    },
    onIntent: (code, listener) => {
      const r = room(code)
      r.intents.add(listener)
      return () => r.intents.delete(listener)
    },
  }
}
