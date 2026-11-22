import { safeStorage } from '@/lib/safeStorage'

const KEYS = ['av:game', 'av:players', 'av:stats'] as const

/**
 * Wipes the game, players and stats saved on this phone (settings are kept).
 * Stores are imported on demand so the crash screen stays out of the initial bundle.
 */
export async function resetLocalData(): Promise<void> {
  for (const key of KEYS) safeStorage.removeItem(key)
  const [{ gameStore }, { playersStore }, { statsStore }] = await Promise.all([
    import('@/features/game/gameStore'),
    import('@/features/players/playersStore'),
    import('@/features/players/statsStore'),
  ])
  gameStore.setState({ game: null, error: null })
  playersStore.setState({ players: [] })
  statsStore.setState({ recordedGameIds: [], byPlayer: {} })
  for (const key of KEYS) safeStorage.removeItem(key)
}
