import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseTransport } from './supabaseTransport'
import type { RoomState } from './types'

type Cb = (payload: Record<string, unknown>) => void

function fakeClient() {
  const ops: string[] = []
  const changes: { table: string; cb: Cb }[] = []
  let presenceSync: (() => void) | null = null
  let presence: Record<string, unknown[]> = {}
  const channel = {
    on: (type: string, filter: { table?: string; event?: string }, cb: Cb) => {
      if (type === 'postgres_changes') changes.push({ table: filter.table!, cb })
      if (type === 'presence' && filter.event === 'sync') presenceSync = cb as unknown as () => void
      return channel
    },
    subscribe: (cb?: (status: string) => void) => {
      setTimeout(() => cb?.('SUBSCRIBED'), 0)
      return channel
    },
    track: async (payload: { id: string }) => {
      ops.push(`track ${payload.id}`)
      return 'ok'
    },
    presenceState: () => presence,
    unsubscribe: async () => 'ok',
  }
  const table = (name: string) => ({
    insert: async (row: Record<string, unknown>) => {
      ops.push(`insert ${name} ${JSON.stringify(row.intent ?? { v: row.version })}`)
      return { error: null }
    },
    update: (row: Record<string, unknown>) => ({
      eq: (_: string, code: string) => ({
        then: (resolve: (r: { error: null }) => void) => {
          ops.push(`touch ${name} ${code}`)
          resolve({ error: null })
        },
        lt: async (_c: string, v: number) => {
          ops.push(`update ${name} ${code} ${row.version ?? 'touch'} if<${v}`)
          return { error: null }
        },
      }),
    }),
  })
  const client = {
    channel: () => channel,
    removeChannel: async () => 'ok',
    from: table,
    rpc: async (fn: string, args: Record<string, unknown>) => {
      ops.push(`rpc ${fn} ${args.p_code}`)
      if (fn === 'join_room')
        return { data: args.p_code === 'ABCDEF' ? state(4) : null, error: null }
      return { data: true, error: null }
    },
  }
  return {
    client: client as unknown as SupabaseClient,
    ops,
    emit: (tbl: string, row: Record<string, unknown>) =>
      changes.filter((c) => c.table === tbl).forEach((c) => c.cb({ new: row })),
    setPresence: (ids: string[]) => {
      presence = Object.fromEntries(ids.map((id) => [id, [{ id }]]))
      presenceSync?.()
    },
  }
}

const state = (version: number, hostId = 'a'): RoomState => ({
  code: 'ABCDEF',
  version,
  hostId,
  status: 'lobby',
  members: [],
  game: null,
  reactions: [],
})
const tick = () => new Promise((r) => setTimeout(r, 5))

test('joining goes through the join_room function', async () => {
  const f = fakeClient()
  const t = createSupabaseTransport(async () => f.client)
  expect(await t.readSnapshot('ABCDEF')).toMatchObject({ version: 4 })
  expect(await t.readSnapshot('ZZZZZZ')).toBeNull()
  expect(f.ops).toEqual(['rpc join_room ABCDEF', 'rpc join_room ZZZZZZ'])
})

test('the host inserts the room, then only writes newer versions', async () => {
  const f = fakeClient()
  const t = createSupabaseTransport(async () => f.client)
  t.publishState(state(1))
  t.publishState(state(2, 'b'))
  await tick()
  expect(f.ops).toEqual(['insert rooms {"v":1}', 'update rooms ABCDEF 2 if<2'])
})

test('intents are inserted in the intents table; the host receives them with the server-stamped sender', async () => {
  const f = fakeClient()
  const t = createSupabaseTransport(async () => f.client)
  const received: unknown[] = []
  t.onIntent('ABCDEF', (i) => received.push(i))
  t.sendIntent('ABCDEF', { id: 'i1', from: 'forged', type: 'leave' })
  await tick()
  expect(f.ops).toContain('insert room_intents {"id":"i1","from":"forged","type":"leave"}')
  f.emit('room_intents', {
    code: 'ABCDEF',
    from_id: 'real-user',
    intent: { id: 'i1', from: 'forged', type: 'leave' },
  })
  expect(received).toEqual([{ id: 'i1', from: 'real-user', type: 'leave' }])
})

test('room states arrive from database changes', async () => {
  const f = fakeClient()
  const t = createSupabaseTransport(async () => f.client)
  const states: RoomState[] = []
  const off = t.onState('ABCDEF', (s) => states.push(s))
  await tick()
  f.emit('rooms', { code: 'ABCDEF', state: state(7) })
  off()
  f.emit('rooms', { code: 'ABCDEF', state: state(8) })
  expect(states.map((s) => s.version)).toEqual([7])
})

test('presence lists who is online; taking over hosting calls claim_host', async () => {
  const f = fakeClient()
  const t = createSupabaseTransport(async () => f.client)
  const seen: string[][] = []
  t.onPresence('ABCDEF', (ids) => seen.push([...ids].sort()))
  t.track('ABCDEF', 'a')
  await tick()
  f.setPresence(['a', 'b'])
  expect(seen.at(-1)).toEqual(['a', 'b'])
  expect(f.ops).toContain('track a')
  expect(await t.claimHost(state(12, 'b'))).toBe(true)
  expect(f.ops).toContain('rpc claim_host ABCDEF')
})
