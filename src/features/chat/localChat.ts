import type { Bus } from '@/features/room/bus'
import { newId } from '@/lib/id'
import { safeStorage } from '@/lib/safeStorage'
import { CHAT_KEPT, type ChatMessage, type ChatTransport } from './types'

const key = (code: string) => `av:chat:${code}`

function read(code: string): ChatMessage[] {
  try {
    const list = JSON.parse((safeStorage.getItem(key(code)) as string | null) ?? '[]') as unknown
    return Array.isArray(list) ? (list as ChatMessage[]) : []
  } catch {
    return []
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}

/** Chat over the local bus (tabs of one browser, or memory in tests); voice notes as data URLs. */
export function createLocalChat(bus: Bus): ChatTransport {
  const origin = newId('chat')
  return {
    history: async (code) => read(code),
    send: async (code, from, outgoing) => {
      const message: ChatMessage = { ...outgoing, from, at: Date.now() }
      safeStorage.setItem(key(code), JSON.stringify([...read(code), message].slice(-CHAT_KEPT)))
      bus.publish({ kind: 'chat', code, message, origin })
      return message
    },
    onMessage: (code, listener) =>
      bus.subscribe((m) => {
        if (m.kind === 'chat' && m.code === code && m.origin !== origin) listener(m.message)
      }),
    uploadVoice: (_code, blob) => blobToDataUrl(blob),
    voiceUrl: async (path) => path,
  }
}
