import type { SupabaseClient } from '@supabase/supabase-js'
import { newId } from '@/lib/id'
import { CHAT_KEPT, type ChatMessage, type ChatTransport } from './types'

interface MessageRow {
  id: string
  from_id: string
  body: {
    text?: string
    voice?: { path: string; ms: number }
    photo?: { path: string; width: number; height: number }
  }
  created_at: string
}

const fromRow = (row: MessageRow): ChatMessage => ({
  id: row.id,
  from: row.from_id,
  ...(row.body.text ? { text: row.body.text } : {}),
  ...(row.body.voice ? { voice: row.body.voice } : {}),
  ...(row.body.photo ? { photo: row.body.photo } : {}),
  at: Date.parse(row.created_at),
})

/** Photos live in their own bucket; their stored path says so. */
const PHOTO_PREFIX = 'photos:'

const EXTENSIONS: Record<string, string> = { 'audio/mp4': 'm4a', 'audio/ogg': 'ogg' }

/**
 * Chat over Supabase (see supabase/migrations/0003_chat_stats.sql): messages in
 * `room_messages` (sender stamped by the server, members only), voice notes in the
 * private `voice` and `photos` storage buckets under the room code, shown through signed URLs.
 */
export function createSupabaseChat(getClient: () => Promise<SupabaseClient>): ChatTransport {
  return {
    history: async (code) => {
      const client = await getClient()
      const { data, error } = await client
        .from('room_messages')
        .select('*')
        .eq('code', code)
        .order('created_at', { ascending: false })
        .limit(CHAT_KEPT)
      if (error) throw error
      return (data as MessageRow[]).map(fromRow).reverse()
    },
    send: async (code, _from, message) => {
      const client = await getClient()
      const body = {
        ...(message.text ? { text: message.text } : {}),
        ...(message.voice ? { voice: message.voice } : {}),
        ...(message.photo ? { photo: message.photo } : {}),
      }
      const { data, error } = await client
        .from('room_messages')
        .insert({ id: message.id, code, body })
        .select()
        .single()
      if (error) throw error
      return fromRow(data as MessageRow)
    },
    onMessage: (code, listener) => {
      let stop = () => {}
      let stopped = false
      void getClient().then((client) => {
        if (stopped) return
        const channel = client
          .channel(`chat:${code}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'room_messages',
              filter: `code=eq.${code}`,
            },
            (change) => listener(fromRow((change as unknown as { new: MessageRow }).new)),
          )
          .subscribe()
        stop = () => void client.removeChannel?.(channel)
      })
      return () => {
        stopped = true
        stop()
      }
    },
    uploadVoice: async (code, blob) => {
      const client = await getClient()
      const type = blob.type.split(';')[0] ?? ''
      const path = `${code}/${newId('voice')}.${EXTENSIONS[type] ?? 'webm'}`
      const { error } = await client.storage
        .from('voice')
        .upload(path, blob, { contentType: type || 'audio/webm' })
      if (error) throw error
      return path
    },
    uploadPhoto: async (code, blob) => {
      const client = await getClient()
      const path = `${code}/${newId('photo')}.jpg`
      const { error } = await client.storage
        .from('photos')
        .upload(path, blob, { contentType: 'image/jpeg' })
      if (error) throw error
      return `${PHOTO_PREFIX}${path}`
    },
    fileUrl: async (stored) => {
      const client = await getClient()
      const photo = stored.startsWith(PHOTO_PREFIX)
      const { data, error } = await client.storage
        .from(photo ? 'photos' : 'voice')
        .createSignedUrl(photo ? stored.slice(PHOTO_PREFIX.length) : stored, 3600)
      if (error || !data) throw error ?? new Error('No URL')
      return data.signedUrl
    },
  }
}
