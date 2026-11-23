import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseSocial } from './supabaseSocial'

function fakeClient(rpcData: Record<string, unknown> = {}) {
  const ops: string[] = []
  let changed: (() => void) | null = null
  const rows = [
    {
      id: 'r1',
      from_id: 'kofi',
      to_id: 'me',
      from_pseudo: 'Kofi',
      from_avatar: '1f981',
      status: 'pending',
      created_at: '2026-11-24T10:00:00Z',
    },
  ]
  const query = {
    or: () => query,
    eq: () => query,
    order: async () => ({ data: rows, error: null }),
  }
  const channel = {
    on: (_t: string, f: { table: string; filter?: string }, cb: () => void) => {
      ops.push(`listen ${f.table} ${f.filter ?? ''}`.trim())
      changed = cb
      return channel
    },
    subscribe: () => channel,
  }
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'me' } } } }) },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      ops.push(`rpc ${fn} ${JSON.stringify(args)}`)
      return { data: rpcData[fn] ?? null, error: null }
    },
    from: () => ({ select: () => query }),
    channel: () => channel,
    removeChannel: async () => 'ok',
  }
  return { client: client as unknown as SupabaseClient, ops, fire: () => changed?.() }
}
const kofi = { id: 'kofi', pseudo: 'Kofi', avatarId: '1f981' }

test('requests, answers and removals go through the server functions', async () => {
  const f = fakeClient({ send_friend_request: 'sent', answer_friend_request: true })
  const social = createSupabaseSocial(async () => f.client)
  expect(await social.sendRequest(kofi)).toBe('sent')
  expect(await social.answer('r1', true)).toBe(true)
  await social.removeFriend('kofi')
  expect(f.ops).toEqual([
    'rpc send_friend_request {"p_to":"kofi"}',
    'rpc answer_friend_request {"p_id":"r1","p_accept":true}',
    'rpc remove_friend {"p_id":"kofi"}',
  ])
})

test('pending requests are read with the sender’s name and avatar', async () => {
  const social = createSupabaseSocial(async () => fakeClient().client)
  expect(await social.requests()).toEqual([
    {
      id: 'r1',
      fromId: 'kofi',
      toId: 'me',
      fromPseudo: 'Kofi',
      fromAvatar: '1f981',
      status: 'pending',
      at: Date.parse('2026-11-24T10:00:00Z'),
    },
  ])
})

test('changes to my requests arrive live', async () => {
  const f = fakeClient()
  const social = createSupabaseSocial(async () => f.client)
  const seen = vi.fn()
  social.onChange(seen)
  await new Promise((r) => setTimeout(r, 0))
  f.fire()
  expect(seen).toHaveBeenCalled()
  expect(f.ops).toContain('listen friend_requests to_id=eq.me')
  expect(f.ops).toContain('listen friend_requests from_id=eq.me')
})

test('the public profile comes from public_profile()', async () => {
  const profile = {
    id: 'kofi',
    pseudo: 'Kofi',
    avatarId: '1f981',
    bio: 'Salut',
    stats: { games: 2 },
  }
  const f = fakeClient({ public_profile: profile })
  expect(await createSupabaseSocial(async () => f.client).publicProfile('kofi')).toMatchObject({
    pseudo: 'Kofi',
    stats: { games: 2, wins: 0 },
  })
})
