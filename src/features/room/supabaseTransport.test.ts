import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseTransport } from './supabaseTransport'
import type { RoomState } from './types'

type Handler = (msg: { payload: unknown }) => void

function fakeClient() {
  const rows = new Map<string, { state: RoomState; host_id: string; version: number }>()
  const sent: { event: string; payload: unknown }[] = []
  const handlers = new Map<string, Handler>()
  const ops: string[] = []
  const channel = {
    on: (_: string, filter: { event: string }, cb: Handler) => {
      handlers.set(filter.event, cb)
      return channel
    },
    subscribe: (cb: (status: string) => void) => {
      setTimeout(() => cb('SUBSCRIBED'), 0)
      return channel
    },
    send: async (msg: { event: string; payload: unknown }) => {
      sent.push(msg)
      return 'ok'
    },
  }
  const client = {
    channel: () => channel,
    from: () => ({
      select: () => ({
        eq: (_: string, code: string) => ({
          maybeSingle: async () => ({
            data: rows.has(code) ? { state: rows.get(code)!.state } : null,
            error: null,
          }),
        }),
      }),
      insert: async (row: { code: string; state: RoomState; host_id: string; version: number }) => {
        ops.push(`insert ${row.code} v${row.version}`)
        rows.set(row.code, row)
        return { error: null }
      },
      update: (row: { state: RoomState; host_id: string; version: number }) => ({
        eq: async (_: string, code: string) => {
          ops.push(`update ${code} v${row.version} host=${row.host_id}`)
          rows.set(code, row)
          return { error: null }
        },
      }),
    }),
  }
  return { client: client as unknown as SupabaseClient, sent, handlers, ops }
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

test('the host inserts the room first, then updates it, and broadcasts each state', async () => {
  const f = fakeClient()
  const transport = createSupabaseTransport(async () => f.client)
  transport.publishState(state(1))
  await tick()
  transport.publishState(state(2, 'b'))
  await tick()
  expect(f.ops).toEqual(['insert ABCDEF v1', 'update ABCDEF v2 host=b'])
  expect(f.sent.map((m) => m.event)).toEqual(['state', 'state'])
  expect(await transport.readSnapshot('ABCDEF')).toMatchObject({ version: 2, hostId: 'b' })
  expect(await transport.readSnapshot('ZZZZZZ')).toBeNull()
})

test('states and intents received on the channel reach listeners until they unsubscribe', async () => {
  const f = fakeClient()
  const transport = createSupabaseTransport(async () => f.client)
  const states: RoomState[] = []
  const off = transport.onState('ABCDEF', (s) => states.push(s))
  const intents: unknown[] = []
  transport.onIntent('ABCDEF', (i) => intents.push(i))
  await tick()
  f.handlers.get('state')!({ payload: state(3) })
  f.handlers.get('intent')!({ payload: { id: 'i1', from: 'b', type: 'leave' } })
  off()
  f.handlers.get('state')!({ payload: state(4) })
  expect(states.map((s) => s.version)).toEqual([3])
  expect(intents).toEqual([{ id: 'i1', from: 'b', type: 'leave' }])
})

test('intents are broadcast on the room channel', async () => {
  const f = fakeClient()
  const transport = createSupabaseTransport(async () => f.client)
  transport.sendIntent('ABCDEF', { id: 'i2', from: 'b', type: 'leave' })
  await tick()
  expect(f.sent).toEqual([
    { type: 'broadcast', event: 'intent', payload: { id: 'i2', from: 'b', type: 'leave' } },
  ])
})
