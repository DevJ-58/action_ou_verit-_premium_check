import { pickIndex, type Rng } from '@/engine'

/** No 0/O, 1/I/L: codes are read aloud and typed on phones. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateRoomCode(rng: Rng): string {
  return Array.from({ length: 6 }, () => ALPHABET[pickIndex(ALPHABET.length, rng)]).join('')
}

export function isRoomCode(value: string): boolean {
  return new RegExp(`^[${ALPHABET}]{6}$`).test(value)
}

export function normalizeRoomCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}
