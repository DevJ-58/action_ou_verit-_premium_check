import { createSeededRng, type Rng } from '@/engine'

/** A random source that always gives the same numbers for the same text. */
export function seeded(text: string): Rng {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return createSeededRng(hash >>> 0)
}

export function pickOf<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length) % items.length]!
}
