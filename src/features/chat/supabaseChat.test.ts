import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseChat } from './supabaseChat'

type Cb = (payload: Record<string, unknown>) => void

function fakeClient() {
  const ops: string[] = []
  let insertCb: Cb | null = null
  const channel = {
    on: (_type: string, filter: { table?: string; filter?: string }, cb: Cb) => {
      ops.push(`listen ${filter.table} ${filter.filter}`)
      insertCb = cb
      return channel
    },
    subscribe: () => channel,
  }
  const rows = [
    {
      id: 'm2',
      code: 'ABCDEF',
      from_id: 'u2',
      body: { text: 'Deux' },
      created_at: '2026-11-23T10:00:02Z',
    },
    {
      id: 'm1',
      code: 'ABCDEF',
      from_id: 'u1',
      body: { text: 'Un' },
      created_at: '2026-11-23T10:00:01Z',
    },
  ]
  const client = {
    channel: () => channel,
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async (n: number) => {
              ops.push(`history ${table} ${n}`)
              return { data: rows, error: null }
            },
          }),
        }),
      }),
      insert: (row: { id: string; code: string; body: unknown }) => ({
        select: () => ({
          single: async () => {
            ops.push(`insert ${table} ${JSON.stringify(row)}`)
            return {
              data: { ...row, from_id: 'server-stamped', created_at: '2026-11-23T10:00:03Z' },
              error: null,
            }
          },
        }),
      }),
    }),
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, _blob: Blob, opts: { contentType: string }) => {
          ops.push(`upload ${bucket} ${path.split('/')[0]} ${opts.contentType}`)
          return { data: { path }, error: null }
        },
        createSignedUrl: async (path: string, seconds: number) => ({
          data: { signedUrl: `https://signed/${path}?t=${seconds}` },
          error: null,
        }),
      }),
    },
  }
  return {
    client: client as unknown as SupabaseClient,
    ops,
    emit: (row: Record<string, unknown>) => insertCb?.({ new: row }),
  }
}

test('history is read oldest first from room_messages', async () => {
  const f = fakeClient()
  const chat = createSupabaseChat(async () => f.client)
  const list = await chat.history('ABCDEF')
  expect(list.map((m) => [m.from, m.text])).toEqual([
    ['u1', 'Un'],
    ['u2', 'Deux'],
  ])
  expect(f.ops).toContain('history room_messages 100')
})

test('sending inserts the message; the server decides who sent it', async () => {
  const f = fakeClient()
  const chat = createSupabaseChat(async () => f.client)
  const sent = await chat.send('ABCDEF', 'forged', { id: 'm3', text: 'Salut' })
  expect(sent).toMatchObject({ id: 'm3', from: 'server-stamped', text: 'Salut' })
  expect(f.ops).toContain(
    'insert room_messages {"id":"m3","code":"ABCDEF","body":{"text":"Salut"}}',
  )
})

test('new messages arrive through database changes of this room only', async () => {
  const f = fakeClient()
  const chat = createSupabaseChat(async () => f.client)
  const got: string[] = []
  chat.onMessage('ABCDEF', (m) => got.push(`${m.from}:${m.text}`))
  await new Promise((r) => setTimeout(r, 0))
  expect(f.ops).toContain('listen room_messages code=eq.ABCDEF')
  f.emit({
    id: 'm9',
    code: 'ABCDEF',
    from_id: 'u2',
    body: { text: 'Yo' },
    created_at: '2026-11-23T10:00:09Z',
  })
  expect(got).toEqual(['u2:Yo'])
})

test('voice notes go to the private “voice” bucket under the room code and play from a signed URL', async () => {
  const f = fakeClient()
  const chat = createSupabaseChat(async () => f.client)
  const path = await chat.uploadVoice('ABCDEF', new Blob(['x'], { type: 'audio/webm;codecs=opus' }))
  expect(f.ops).toContain('upload voice ABCDEF audio/webm')
  expect(await chat.fileUrl(path)).toBe(`https://signed/${path}?t=3600`)
})
