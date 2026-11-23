import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import type { RoomTransport } from './localTransport'
import type { Intent, RoomState } from './types'

interface Room {
  ready: Promise<RealtimeChannel>
  states: Set<(state: RoomState) => void>
  intents: Set<(intent: Intent) => void>
  presence: Set<(online: ReadonlySet<string>) => void>
}

/**
 * Rooms over Supabase (see supabase/migrations/0002_secure_rooms.sql):
 * - joining calls join_room(), which enforces membership rules;
 * - the host writes the `rooms` row; members receive it through database changes;
 * - players send intents by inserting into `room_intents`; the server stamps the sender;
 * - presence on the room channel says who is online; claim_host() lets a member take over.
 */
export function createSupabaseTransport(getClient: () => Promise<SupabaseClient>): RoomTransport {
  const rooms = new Map<string, Room>()

  function room(code: string): Room {
    const existing = rooms.get(code)
    if (existing) return existing
    const r: Room = {
      states: new Set(),
      intents: new Set(),
      presence: new Set(),
      ready: null as unknown as Promise<RealtimeChannel>,
    }
    r.ready = getClient().then(
      (client) =>
        new Promise<RealtimeChannel>((resolve) => {
          const filter = `code=eq.${code}`
          const channel = client
            .channel(`room:${code}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'rooms', filter },
              (change) => {
                const row = (change as unknown as { new?: { state?: RoomState } }).new
                if (row?.state) r.states.forEach((l) => l(row.state!))
              },
            )
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'room_intents', filter },
              (change) => {
                const row = (change as unknown as { new: { from_id: string; intent: Intent } }).new
                const intent = { ...row.intent, from: row.from_id } as Intent
                r.intents.forEach((l) => l(intent))
              },
            )
            .on('presence', { event: 'sync' }, () => {
              const metas = Object.values(channel.presenceState()).flat() as unknown as {
                id?: string
              }[]
              const online = new Set(
                metas.map((m) => m.id).filter((id): id is string => Boolean(id)),
              )
              r.presence.forEach((l) => l(online))
            })
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') resolve(channel)
          })
        }),
    )
    rooms.set(code, r)
    return r
  }

  function subscribe<T>(set: Set<T>, listener: T) {
    set.add(listener)
    return () => {
      set.delete(listener)
    }
  }

  return {
    readSnapshot: async (code) => {
      const client = await getClient()
      const { data, error } = await client.rpc('join_room', { p_code: code })
      if (error) console.error('join_room failed', error)
      return (data as RoomState | null) ?? null
    },
    publishState: (state) => {
      void getClient().then(async (client) => {
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
            : await table.update(row).eq('code', state.code).lt('version', state.version)
        if (error) console.error('Room save failed', error)
      })
    },
    claimHost: async (state) => {
      const client = await getClient()
      const { data, error } = await client.rpc('claim_host', {
        p_code: state.code,
        p_state: state,
        p_version: state.version,
      })
      if (error) console.error('claim_host failed', error)
      return data === true
    },
    touch: (code) => {
      void getClient().then((client) =>
        client.from('rooms').update({ updated_at: new Date().toISOString() }).eq('code', code),
      )
    },
    sendIntent: (code, intent) => {
      void getClient().then(async (client) => {
        // A tap must not be lost to a network blink: try again a few times.
        for (let attempt = 0; attempt < 4; attempt++) {
          const { error } = await client.from('room_intents').insert({ code, intent })
          if (!error) return
          if (attempt === 3) console.error('Intent failed', error)
          else await new Promise((r) => setTimeout(r, 400 * 2 ** attempt))
        }
      })
    },
    recentIntents: async (code, since) => {
      const client = await getClient()
      const { data, error } = await client
        .from('room_intents')
        .select('intent, from_id, created_at')
        .eq('code', code)
        .gte('created_at', new Date(since).toISOString())
        .order('created_at', { ascending: true })
        .limit(100)
      if (error || !data) return []
      return (data as { intent: Intent; from_id: string }[]).map(
        (row) => ({ ...row.intent, from: row.from_id }) as Intent,
      )
    },
    onState: (code, listener) => subscribe(room(code).states, listener),
    onIntent: (code, listener) => subscribe(room(code).intents, listener),
    onPresence: (code, listener) => subscribe(room(code).presence, listener),
    track: (code, memberId) => {
      const ready = room(code).ready
      void ready.then((channel) => channel.track({ id: memberId }))
      return () => {
        void ready.then((channel) => (channel as { untrack?: () => Promise<unknown> }).untrack?.())
      }
    },
  }
}
