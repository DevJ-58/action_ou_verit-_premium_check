import type { SupabaseClient } from '@supabase/supabase-js'
import { EMPTY_ACCOUNT_STATS } from './accountStats'
import { defaultProfile } from './authService'
import { createSupabaseAuth } from './supabaseAuth'

function fakeClient(rpcError = false) {
  const writes: string[] = []
  const client = {
    from: (table: string) => ({
      upsert: async (row: Record<string, unknown>) => {
        writes.push(`upsert ${table} ${Object.keys(row).sort().join(',')}`)
        return { error: null }
      },
      update: (row: Record<string, unknown>) => ({
        eq: async (_c: string, id: string) => {
          writes.push(`update ${table} ${Object.keys(row).sort().join(',')} ${id}`)
          return { error: null }
        },
      }),
    }),
    rpc: async (fn: string, args: Record<string, unknown>) => {
      writes.push(`rpc ${fn} ${JSON.stringify(args)}`)
      return rpcError ? { data: null, error: { code: 'PGRST202' } } : { data: true, error: null }
    },
  }
  return { client: client as unknown as SupabaseClient, writes }
}

test('saving the profile never sends stats or friends (the server owns them)', async () => {
  const f = fakeClient()
  const auth = createSupabaseAuth(async () => f.client)
  await auth.saveProfile({
    ...defaultProfile('u1', 'Awa', '1f981'),
    stats: { ...EMPTY_ACCOUNT_STATS, games: 3 },
    friends: [{ id: 'k', pseudo: 'Kofi', avatarId: '' }],
  })
  expect(f.writes).toEqual([
    'upsert profiles avatar_id,bio,custom_dares,id,limits,pseudo,updated_at',
  ])
})

test('stats alone are written with a targeted update', async () => {
  const f = fakeClient()
  const auth = createSupabaseAuth(async () => f.client)
  await auth.saveStats!('u1', { ...EMPTY_ACCOUNT_STATS, games: 4 })
  expect(f.writes).toEqual(['update profiles stats,updated_at u1'])
})

test('a finished room game is counted by the server for every player', async () => {
  const f = fakeClient()
  const auth = createSupabaseAuth(async () => f.client)
  expect(await auth.recordRoomGame!('ABCDEF', 'game-1')).toBe(true)
  expect(f.writes).toEqual(['rpc record_room_game {"p_code":"ABCDEF","p_game_id":"game-1"}'])
  expect(
    await createSupabaseAuth(async () => fakeClient(true).client).recordRoomGame!('ABCDEF', 'g'),
  ).toBe(false)
})
