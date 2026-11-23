/** A message in the room chat: text, or a voice note stored by the backend. */
export interface ChatMessage {
  id: string
  from: string
  text?: string
  voice?: { path: string; ms: number }
  at: number
}

export type OutgoingMessage = Pick<ChatMessage, 'id' | 'text' | 'voice'>

/** How a phone exchanges chat messages and voice notes with its room. */
export interface ChatTransport {
  /** Latest messages, oldest first. */
  history(code: string): Promise<ChatMessage[]>
  send(code: string, from: string, message: OutgoingMessage): Promise<ChatMessage>
  onMessage(code: string, listener: (message: ChatMessage) => void): () => void
  /** Stores a voice note and returns its path. */
  uploadVoice(code: string, blob: Blob): Promise<string>
  /** A playable address for a stored voice note. */
  voiceUrl(path: string): Promise<string>
}

export const CHAT_TEXT_MAX = 500
export const VOICE_MAX_MS = 30_000
export const CHAT_KEPT = 100
