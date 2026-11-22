import { useStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { systemDares } from '@/content/systemDares'
import {
  createGame,
  createSeededRng,
  GameRuleError,
  reduce,
  type GameAction,
  type GameRuleCode,
  type GameSettings,
  type GameState,
  type Player,
  type Rng,
} from '@/engine'
import { newId } from '@/lib/id'
import { safeStorage } from '@/lib/safeStorage'
import { isValidGame } from './validateGame'

export interface GameStoreState {
  game: GameState | null
  error: GameRuleCode | null
  start(input: { settings: GameSettings; players: Player[] }): void
  dispatch(action: GameAction): void
  quit(): void
}

/** Math.random, or a seeded generator when `?seed=` is set outside production (tests, demos). */
export function defaultRng(): Rng {
  if (!import.meta.env.PROD && typeof window !== 'undefined') {
    const seed = new URLSearchParams(window.location.search).get('seed')
    if (seed !== null && Number.isFinite(Number(seed))) return createSeededRng(Number(seed))
  }
  return Math.random
}

export function createGameStore(rngFactory: () => Rng = defaultRng) {
  const rng = rngFactory()
  return createStore<GameStoreState>()(
    persist(
      (set, get) => ({
        game: null,
        error: null,
        start: ({ settings, players }) => {
          try {
            set({ game: createGame({ id: newId('game'), settings, players }), error: null })
          } catch (error) {
            if (error instanceof GameRuleError) set({ error: error.code })
            else throw error
          }
        },
        dispatch: (action) => {
          const { game } = get()
          if (!game) return
          try {
            set({ game: reduce(game, action, { rng, systemDares }), error: null })
          } catch (error) {
            if (error instanceof GameRuleError) set({ error: error.code })
            else throw error
          }
        },
        quit: () => set({ game: null, error: null }),
      }),
      {
        name: 'av:game',
        version: 1,
        storage: createJSONStorage(() => safeStorage),
        partialize: ({ game }) => ({ game }),
        migrate: () => ({ game: null }) as unknown as GameStoreState,
        merge: (persisted, current) => {
          const game = (persisted as { game?: unknown } | undefined)?.game
          return { ...current, game: isValidGame(game) ? game : null }
        },
      },
    ),
  )
}

export const gameStore = createGameStore()

export function useGame<T>(selector: (state: GameStoreState) => T): T {
  return useStore(gameStore, selector)
}
