import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseSignals } from './supabaseSignals'

function fakeClient() {
  const ops: string[] = []
  let handler: ((p: { payload: unknown }) => void) | null = null
  const channel = {
    on: (type: string, filter: { event: string }, cb: typeof handler) => {
      ops.push(`on ${type} ${filter.event}`)
      handler = cb
      return channel
    },
    subscribe: (cb?: (s: string) => void) => {
      setTimeout(() => cb?.('SUBSCRIBED'), 0)
      return channel
    },
    send: async (msg: { type: string; event: string; payload: unknown }) => {
      ops.push(`send ${msg.event} ${JSON.stringify(msg.payload)}`)
      return 'ok'
    },
  }
  const client = {
    realtime: { setAuth: async () => void ops.push('setAuth') },
    channel: (name: string, opts: { config: { private: boolean } }) => {
      ops.push(`channel ${name} private=${opts.config.private}`)
      return channel
    },
    removeChannel: async () => 'ok',
  }
  return {
    client: client as unknown as SupabaseClient,
    ops,
    deliver: (payload: unknown) => handler?.({ payload }),
  }
}
const tick = () => new Promise((r) => setTimeout(r, 5))

test('signals travel on the private live channel of the room', async () => {
  const f = fakeClient()
  const t = createSupabaseSignals(async () => f.client)
  t.send('ABCDEF', { from: 'kofi', to: 'awa', body: { type: 'hello' } })
  await tick()
  expect(f.ops).toEqual([
    'setAuth',
    'channel live:ABCDEF private=true',
    'on broadcast signal',
    'send signal {"from":"kofi","to":"awa","body":{"type":"hello"}}',
  ])
})

test('only the signals addressed to this phone are delivered', async () => {
  const f = fakeClient()
  const t = createSupabaseSignals(async () => f.client)
  const got: string[] = []
  t.onSignal('ABCDEF', 'awa', (s) => got.push(`${s.from}:${s.body.type}`))
  await tick()
  f.deliver({ from: 'kofi', to: 'awa', body: { type: 'offer', sdp: 'x' } })
  f.deliver({ from: 'kofi', to: 'ines', body: { type: 'offer', sdp: 'y' } })
  expect(got).toEqual(['kofi:offer'])
})
