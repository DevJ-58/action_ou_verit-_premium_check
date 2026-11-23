import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { AuthError, type AuthErrorCode, type Profile, type Session } from './authService'
import { getAuthService } from './getAuthService'
import { recordAccountGame, type FinishedGame } from './accountStats'
import { withFriend, type Friend } from '@/features/friends/friends'

export interface AccountState {
  status: 'loading' | 'signedOut' | 'signedIn'
  session: Session | null
  init(): Promise<void>
  signUp(email: string, password: string, pseudo: string): Promise<AuthErrorCode | null>
  signIn(email: string, password: string): Promise<AuthErrorCode | null>
  signOut(): Promise<void>
  updateProfile(patch: Partial<Omit<Profile, 'id'>>): Promise<void>
  /** Adds a finished game to the signed-in player's stats (once per game). */
  /** `asPlayer`: the player id this account had in that game (its own id in rooms). */
  recordGame(game: FinishedGame, asPlayer?: string): Promise<void>
  /** A room game: counted by the server when it can, else on this phone. */
  recordRoomGame(code: string, game: FinishedGame): Promise<void>
  /** Re-reads the Premium end date (after a purchase). */
  refreshPremium(): Promise<void>
  /** Re-reads the profile (friends changed on the server side). */
  reloadProfile(): Promise<void>
  addFriend(friend: Friend): Promise<void>
  removeFriend(id: string): Promise<void>
}

async function attempt(fn: () => Promise<Session>, set: (s: Partial<AccountState>) => void) {
  try {
    const session = await fn()
    set({ status: 'signedIn', session })
    return null
  } catch (error) {
    if (error instanceof AuthError) return error.code
    return 'network' as const
  }
}

export const accountStore = createStore<AccountState>()((set, get) => ({
  status: 'loading',
  session: null,
  init: async () => {
    const session = await getAuthService().current()
    set({ status: session ? 'signedIn' : 'signedOut', session })
  },
  signUp: (email, password, pseudo) =>
    attempt(() => getAuthService().signUp(email, password, pseudo), set),
  signIn: (email, password) => attempt(() => getAuthService().signIn(email, password), set),
  signOut: async () => {
    await getAuthService().signOut()
    set({ status: 'signedOut', session: null })
  },
  updateProfile: async (patch) => {
    const session = get().session
    if (!session) return
    const profile = { ...session.profile, ...patch, id: session.profile.id }
    set({ session: { ...session, profile } })
    await getAuthService().saveProfile(profile)
  },
  recordGame: async (game, asPlayer) => {
    const profile = get().session?.profile
    if (!profile) return
    const stats = recordAccountGame(profile.stats, game, asPlayer ?? profile.id)
    if (stats === profile.stats) return
    const session = get().session!
    set({ session: { ...session, profile: { ...session.profile, stats } } })
    const service = getAuthService()
    if (service.saveStats) await service.saveStats(profile.id, stats)
    else await service.saveProfile({ ...get().session!.profile })
  },
  recordRoomGame: async (code, game) => {
    const profile = get().session?.profile
    if (!profile || game.phase !== 'finished' || profile.stats.gameIds.includes(game.id)) return
    const counted = await getAuthService()
      .recordRoomGame?.(code, game.id)
      .catch(() => false)
    if (counted) return get().reloadProfile()
    return get().recordGame(game)
  },
  refreshPremium: async () => {
    const fresh = await getAuthService().current()
    const session = get().session
    if (fresh && session && fresh.account.id === session.account.id) {
      set({
        session: { ...session, premiumUntil: fresh.premiumUntil, premiumTrial: fresh.premiumTrial },
      })
    }
  },
  reloadProfile: async () => {
    const fresh = await getAuthService().current()
    const session = get().session
    if (fresh && session && fresh.account.id === session.account.id) set({ session: fresh })
  },
  addFriend: async (friend) => {
    const profile = get().session?.profile
    if (!profile || friend.id === profile.id) return
    await get().updateProfile({ friends: withFriend(profile.friends, friend) })
  },
  removeFriend: async (id) => {
    const profile = get().session?.profile
    if (!profile) return
    await get().updateProfile({ friends: profile.friends.filter((f) => f.id !== id) })
  },
}))

export function useAccount<T>(selector: (state: AccountState) => T): T {
  return useStore(accountStore, selector)
}
