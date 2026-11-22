// Test helpers for the engine (imported by *.test.ts only).
import type { Dare, Player } from './types'

export function makePlayer(id: string, over: Partial<Player> = {}): Player {
  return {
    id,
    name: id,
    avatar: '',
    limits: { excludedCategories: [], maxIntensity: 4 },
    customDares: [],
    ...over,
  }
}

export function makeDare(id: string, over: Partial<Dare> = {}): Dare {
  return {
    id,
    kind: 'dare',
    category: 'fun',
    intensity: 1,
    modes: ['nearby', 'remote'],
    text: `Défi ${id}`,
    ...over,
  }
}

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const key of Object.keys(value)) deepFreeze((value as Record<string, unknown>)[key])
  }
  return value
}
