import { useStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import type { Dare, Player } from '@/engine'
import { newId } from '@/lib/id'
import { safeStorage } from '@/lib/safeStorage'

function isValidPlayer(value: unknown): value is Player {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.limits === 'object' &&
    p.limits !== null &&
    Array.isArray((p.limits as Record<string, unknown>).excludedCategories) &&
    Array.isArray(p.customDares)
  )
}

export type CustomDareDraft = Omit<Dare, 'id' | 'authorId'> & { id?: string }

export interface PlayersState {
  players: Player[]
  addPlayer(input: { name: string; avatar: string }): Player
  updatePlayer(id: string, patch: Partial<Omit<Player, 'id'>>): void
  removePlayer(id: string): void
  upsertCustomDare(playerId: string, dare: CustomDareDraft): void
  removeCustomDare(playerId: string, dareId: string): void
}

export function createPlayersStore() {
  return createStore<PlayersState>()(
    persist(
      (set) => {
        const mapPlayer = (id: string, fn: (player: Player) => Player) =>
          set((state) => ({ players: state.players.map((p) => (p.id === id ? fn(p) : p)) }))
        return {
          players: [],
          addPlayer: ({ name, avatar }) => {
            const player: Player = {
              id: newId('player'),
              name,
              avatar,
              limits: { excludedCategories: [], maxIntensity: 4 },
              customDares: [],
            }
            set((state) => ({ players: [...state.players, player] }))
            return player
          },
          updatePlayer: (id, patch) => mapPlayer(id, (p) => ({ ...p, ...patch, id })),
          removePlayer: (id) =>
            set((state) => ({ players: state.players.filter((p) => p.id !== id) })),
          upsertCustomDare: (playerId, draft) =>
            mapPlayer(playerId, (p) => {
              const dare: Dare = { ...draft, id: draft.id ?? newId('custom'), authorId: playerId }
              const exists = p.customDares.some((d) => d.id === dare.id)
              return {
                ...p,
                customDares: exists
                  ? p.customDares.map((d) => (d.id === dare.id ? dare : d))
                  : [...p.customDares, dare],
              }
            }),
          removeCustomDare: (playerId, dareId) =>
            mapPlayer(playerId, (p) => ({
              ...p,
              customDares: p.customDares.filter((d) => d.id !== dareId),
            })),
        }
      },
      {
        name: 'av:players',
        version: 1,
        storage: createJSONStorage(() => safeStorage),
        partialize: ({ players }) => ({ players }),
        migrate: () => ({ players: [] }) as unknown as PlayersState,
        merge: (persisted, current) => {
          const players = (persisted as { players?: unknown } | undefined)?.players
          return {
            ...current,
            players: Array.isArray(players) ? players.filter(isValidPlayer) : [],
          }
        },
      },
    ),
  )
}

export const playersStore = createPlayersStore()

export function usePlayers<T>(selector: (state: PlayersState) => T): T {
  return useStore(playersStore, selector)
}
