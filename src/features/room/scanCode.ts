import { isRoomCode, normalizeRoomCode } from './roomCode'

/** The room code inside a scanned QR code (an invitation link or the bare code), or null. */
export function codeFromScan(text: string): string | null {
  const fromLink = /\/salon\/([A-Za-z0-9]{6})(?:[/?#]|$)/.exec(text.trim())
  const candidate = normalizeRoomCode(fromLink ? fromLink[1]! : text)
  return isRoomCode(candidate) ? candidate : null
}
