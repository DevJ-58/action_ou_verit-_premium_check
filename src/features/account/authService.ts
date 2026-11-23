import type { Dare, PlayerLimits } from '@/engine'
import { EMPTY_ACCOUNT_STATS, type AccountStats } from './accountStats'
import type { Friend } from '@/features/friends/friends'

export interface Account {
  id: string
  email: string
}

/** What a player shows and keeps across games and devices. */
export interface Profile {
  id: string
  pseudo: string
  avatarId: string
  bio: string
  limits: PlayerLimits
  customDares: Dare[]
  stats: AccountStats
  friends: Friend[]
}

export interface Session {
  account: Account
  profile: Profile
  /** End of Premium (ISO date), null if never bought. Written by the server only. */
  premiumUntil: string | null
  /** The current Premium is the free trial of a new account. */
  premiumTrial: boolean
}

export type AuthErrorCode =
  'emailTaken' | 'badCredentials' | 'weakPassword' | 'invalidEmail' | 'confirmEmail' | 'network'

export class AuthError extends Error {
  readonly code: AuthErrorCode
  constructor(code: AuthErrorCode) {
    super(`Auth error: ${code}`)
    this.name = 'AuthError'
    this.code = code
  }
}

/** Accounts and profiles, backed either by this device (local) or by Supabase. */
export interface AuthService {
  current(): Promise<Session | null>
  signUp(email: string, password: string, pseudo: string): Promise<Session>
  signIn(email: string, password: string): Promise<Session>
  signOut(): Promise<void>
  saveProfile(profile: Profile): Promise<Profile>
  /** Writes only the stats (a game counted on this phone). */
  saveStats?(id: string, stats: AccountStats): Promise<void>
  /** Has the server count a finished room game for every player in it (true if done). */
  recordRoomGame?(code: string, gameId: string): Promise<boolean>
}

export const PASSWORD_MIN = 8
export const BIO_MAX = 160

export function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase('en')
}

export function checkCredentials(email: string, password: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) throw new AuthError('invalidEmail')
  if (password.length < PASSWORD_MIN) throw new AuthError('weakPassword')
}

export function defaultProfile(id: string, pseudo: string, avatarId: string): Profile {
  return {
    id,
    pseudo,
    avatarId,
    bio: '',
    limits: { excludedCategories: [], maxIntensity: 4 },
    customDares: [],
    stats: EMPTY_ACCOUNT_STATS,
    friends: [],
  }
}
