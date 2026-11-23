import { createStore } from 'zustand/vanilla'
import { newId } from '@/lib/id'
import {
  CHAT_KEPT,
  CHAT_TEXT_MAX,
  PHOTO_MAX_BYTES,
  VOICE_MAX_MS,
  type ChatMessage,
  type ChatTransport,
} from './types'

export interface ChatState {
  transport: ChatTransport
  messages: ChatMessage[]
  unread: number
  open: boolean
  /** Loads the history and starts listening; returns a function that stops listening. */
  connect(): Promise<() => void>
  sendText(text: string): Promise<boolean>
  sendVoice(blob: Blob, ms: number): Promise<boolean>
  sendPhoto(blob: Blob, width: number, height: number): Promise<boolean>
  setOpen(open: boolean): void
}

export type ChatStore = ReturnType<typeof createChatStore>

/** The chat of one room, as seen from one phone. */
export function createChatStore(input: {
  transport: ChatTransport
  code: string
  selfId: string
  onIncoming?(message: ChatMessage): void
}) {
  const { transport, code, selfId, onIncoming } = input
  return createStore<ChatState>()((set, get) => {
    const add = (message: ChatMessage, incoming: boolean) => {
      if (get().messages.some((m) => m.id === message.id)) return
      set((s) => ({
        messages: [...s.messages, message].slice(-CHAT_KEPT),
        unread: incoming && !s.open ? s.unread + 1 : s.unread,
      }))
      if (incoming) onIncoming?.(message)
    }
    const send = async (outgoing: Omit<ChatMessage, 'id' | 'from' | 'at'>) => {
      try {
        add(await transport.send(code, selfId, { id: newId('msg'), ...outgoing }), false)
        return true
      } catch {
        return false
      }
    }
    return {
      transport,
      messages: [],
      unread: 0,
      open: false,
      connect: async () => {
        const off = transport.onMessage(code, (m) => add(m, m.from !== selfId))
        const earlier = await transport.history(code).catch(() => [])
        const known = new Set(get().messages.map((m) => m.id))
        set((s) => ({
          messages: [...earlier.filter((m) => !known.has(m.id)), ...s.messages]
            .sort((a, b) => a.at - b.at)
            .slice(-CHAT_KEPT),
        }))
        return off
      },
      sendText: async (text) => {
        const value = text.trim()
        if (!value || value.length > CHAT_TEXT_MAX) return false
        return send({ text: value })
      },
      sendVoice: async (blob, ms) => {
        if (ms <= 0 || ms > VOICE_MAX_MS) return false
        try {
          const path = await transport.uploadVoice(code, blob)
          return send({ voice: { path, ms: Math.round(ms) } })
        } catch {
          return false
        }
      },
      sendPhoto: async (blob, width, height) => {
        if (blob.size > PHOTO_MAX_BYTES || !blob.type.startsWith('image/')) return false
        try {
          const path = await transport.uploadPhoto(code, blob)
          return send({ photo: { path, width: Math.round(width), height: Math.round(height) } })
        } catch {
          return false
        }
      },
      setOpen: (open) => set(open ? { open, unread: 0 } : { open }),
    }
  })
}
