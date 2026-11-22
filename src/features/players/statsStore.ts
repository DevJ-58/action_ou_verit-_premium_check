import { useStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import type { GameState } from '@/engine'
import { safeStorage } from '@/lib/safeStorage'

export interface PlayerStats {
  games: number
  done: number
  skipped: number
}

export interface StatsState {
  recordedGameIds: string[]
  byPlayer: Record<string, PlayerStats>
  recordGame(state: GameState): void
  statsFor(playerId: string): PlayerStats
}

const EMPTY: PlayerStats = { games: 0, done: 0, skipped: 0 }

export function createStatsStore() {
  return createStore<StatsState>()(
    persist(
      (set, get) => ({
        recordedGameIds: [],
        byPlayer: {},
        recordGame: (state) => {
          if (state.phase !== 'finished' || get().recordedGameIds.includes(state.id)) return
          const byPlayer = { ...get().byPlayer }
          for (const player of state.players) {
            const prev = byPlayer[player.id] ?? EMPTY
            const score = state.scores[player.id]
            byPlayer[player.id] = {
              games: prev.games + 1,
              done: prev.done + (score?.done ?? 0),
              skipped: prev.skipped + (score?.skipped ?? 0),
            }
          }
          set({ byPlayer, recordedGameIds: [...get().recordedGameIds, state.id].slice(-200) })
        },
        statsFor: (playerId) => get().byPlayer[playerId] ?? EMPTY,
      }),
      {
        name: 'av:stats',
        version: 1,
        storage: createJSONStorage(() => safeStorage),
        partialize: ({ recordedGameIds, byPlayer }) => ({ recordedGameIds, byPlayer }),
        migrate: () => ({ recordedGameIds: [], byPlayer: {} }) as unknown as StatsState,
      },
    ),
  )
}

export const statsStore = createStatsStore()

export function useStats<T>(selector: (state: StatsState) => T): T {
  return useStore(statsStore, selector)
}
