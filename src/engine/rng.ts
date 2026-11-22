import type { Rng } from './types'

/** Deterministic PRNG (mulberry32) — used for tests and reproducible games. */
export function createSeededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A uniformly random index in [0, length). */
export function pickIndex(length: number, rng: Rng): number {
  return Math.min(length - 1, Math.floor(rng() * length))
}
