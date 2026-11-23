import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseInvites } from './supabaseInvites'

function fakeClient() {
  const ops: string[] = []
  let cb: ((p: { new: Record<string, unknown> }) => void) | null = null
  const row = {
    id: 'i1',
    code: 'ABCDEF',
    from_id: 'awa',
    to_id: 'kofi',
    from_pseudo: 'Awa',
    from_avatar: '1f981',
    created_at: new Date().toISOString(),
  }
  const channel = {
    on: (_t: string, f: { table: string; filter: string }, c: typeof cb) => {
      ops.push(`listen ${f.table} ${f.filter}`)
      cb = c
      return channel
    },
    subscribe: () => channel,
  }
  const client = {
    channel: () => channel,
    removeChannel: async () => 'ok',
    from: (table: string) => ({
      insert: async (r: Record<string, unknown>) => {
        ops.push(`insert ${table} ${JSON.stringify(r)}`)
        return { error: null }
      },
      select: () => ({
        eq: () => ({
          gte: () => ({
            order: async () => ({ data: [row], error: null }),
          }),
        }),
      }),
      delete: () => ({
        eq: (_c: string, code: string) => ({
          eq: async (_c2: string, to: string) => {
            ops.push(`delete ${table} ${code} ${to}`)
            return { error: null }
          },
        }),
      }),
    }),
  }
  return { client: client as unknown as SupabaseClient, ops, emit: () => cb?.({ new: row }) }
}

test('sending inserts an invitation; the server stamps the sender', async () => {
  const f = fakeClient()
  const t = createSupabaseInvites(async () => f.client)
  await t.send({
    code: 'ABCDEF',
    fromId: 'forged',
    fromPseudo: 'Awa',
    fromAvatar: 'a',
    toId: 'kofi',
  })
  expect(f.ops).toEqual([
    'insert room_invites {"code":"ABCDEF","to_id":"kofi","from_pseudo":"Awa","from_avatar":"a"}',
  ])
})

test('pending invitations and live ones are read for this player', async () => {
  const f = fakeClient()
  const t = createSupabaseInvites(async () => f.client)
  expect(await t.pending('kofi')).toMatchObject([
    { code: 'ABCDEF', fromId: 'awa', fromPseudo: 'Awa' },
  ])
  const got: string[] = []
  t.onInvite('kofi', (i) => got.push(i.code))
  await new Promise((r) => setTimeout(r, 0))
  f.emit()
  expect(f.ops).toContain('listen room_invites to_id=eq.kofi')
  expect(got).toEqual(['ABCDEF'])
})

test('dismissing deletes the invitations to that room', async () => {
  const f = fakeClient()
  const t = createSupabaseInvites(async () => f.client)
  const [invite] = await t.pending('kofi')
  await t.dismiss(invite!)
  expect(f.ops).toContain('delete room_invites ABCDEF kofi')
})
