import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { AuthError, type AuthErrorCode, type Profile, type Session } from './authService'
import { getAuthService } from './getAuthService'

export interface AccountState {
  status: 'loading' | 'signedOut' | 'signedIn'
  session: Session | null
  init(): Promise<void>
  signUp(email: string, password: string, pseudo: string): Promise<AuthErrorCode | null>
  signIn(email: string, password: string): Promise<AuthErrorCode | null>
  signOut(): Promise<void>
  updateProfile(patch: Partial<Omit<Profile, 'id'>>): Promise<void>
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
}))

export function useAccount<T>(selector: (state: AccountState) => T): T {
  return useStore(accountStore, selector)
}
