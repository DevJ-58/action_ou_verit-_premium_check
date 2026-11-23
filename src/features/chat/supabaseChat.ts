import type { SupabaseClient } from '@supabase/supabase-js'
import { newId } from '@/lib/id'
import { CHAT_KEPT, type ChatMessage, type ChatTransport } from './types'

interface MessageRow {
  id: string
  from_id: string
  body: { text?: string; voice?: { path: string; ms: number } }
  created_at: string
}

const fromRow = (row: MessageRow): ChatMessage => ({
  id: row.id,
  from: row.from_id,
  ...(row.body.text ? { text: row.body.text } : {}),
  ...(row.body.voice ? { voice: row.body.voice } : {}),
  at: Date.parse(row.created_at),
})

const EXTENSIONS: Record<string, string> = { 'audio/mp4': 'm4a', 'audio/ogg': 'ogg' }

/**
 * Chat over Supabase (see supabase/migrations/0003_chat_stats.sql): messages in
 * `room_messages` (sender stamped by the server, members only), voice notes in the
 * private `voice` storage bucket under the room code, played through signed URLs.
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
    voiceUrl: async (path) => {
      const client = await getClient()
      const { data, error } = await client.storage.from('voice').createSignedUrl(path, 3600)
      if (error || !data) throw error ?? new Error('No URL')
      return data.signedUrl
    },
  }
}
