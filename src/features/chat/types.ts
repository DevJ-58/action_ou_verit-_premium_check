/** A message in the room chat: text, or a voice note stored by the backend. */
export interface ChatMessage {
  id: string
  from: string
  text?: string
  voice?: { path: string; ms: number }
  photo?: { path: string; width: number; height: number }
  at: number
}

export type OutgoingMessage = Pick<ChatMessage, 'id' | 'text' | 'voice' | 'photo'>

/** How a phone exchanges chat messages and voice notes with its room. */
export interface ChatTransport {
  /** Latest messages, oldest first. */
  history(code: string): Promise<ChatMessage[]>
  send(code: string, from: string, message: OutgoingMessage): Promise<ChatMessage>
  onMessage(code: string, listener: (message: ChatMessage) => void): () => void
  /** Stores a voice note and returns its path. */
  uploadVoice(code: string, blob: Blob): Promise<string>
  /** Stores a photo and returns its path. */
  uploadPhoto(code: string, blob: Blob): Promise<string>
  /** A displayable / playable address for a stored voice note or photo. */
  fileUrl(path: string): Promise<string>
}

export const CHAT_TEXT_MAX = 500
export const VOICE_MAX_MS = 30_000
export const CHAT_KEPT = 100
export const PHOTO_MAX_BYTES = 3 * 1024 * 1024
