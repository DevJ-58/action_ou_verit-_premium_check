import type { SupabaseClient, User } from '@supabase/supabase-js'
import { randomFreeAvatar } from '@/content/avatars'
import type { Dare, PlayerLimits } from '@/engine'
import { sanitizeStats } from './accountStats'
import { sanitizeFriends } from '@/features/friends/friends'
import {
  AuthError,
  checkCredentials,
  defaultProfile,
  normalizeEmail,
  type AuthErrorCode,
  type AuthService,
  type Profile,
  type Session,
} from './authService'

interface ProfileRow {
  id: string
  pseudo: string
  avatar_id: string
  bio: string
  limits: PlayerLimits
  custom_dares: Dare[]
  stats?: unknown
  friends?: unknown
}

/**
 * What the player edits themselves. Stats and friends are never sent: the server keeps them
 * (record_room_game, befriend…), and a stale copy on a phone must not overwrite them.
 */
const toRow = (p: Profile) => ({
  id: p.id,
  pseudo: p.pseudo,
  avatar_id: p.avatarId,
  bio: p.bio,
  limits: p.limits,
  custom_dares: p.customDares,
})

const fromRow = (r: ProfileRow): Profile => ({
  id: r.id,
  pseudo: r.pseudo,
  avatarId: r.avatar_id,
  bio: r.bio,
  limits: r.limits,
  customDares: r.custom_dares,
  stats: sanitizeStats(r.stats),
  friends: sanitizeFriends(r.friends),
})

const CODES: Record<string, AuthErrorCode> = {
  user_already_exists: 'emailTaken',
  email_exists: 'emailTaken',
  weak_password: 'weakPassword',
  invalid_credentials: 'badCredentials',
  email_address_invalid: 'invalidEmail',
  validation_failed: 'invalidEmail',
  email_not_confirmed: 'confirmEmail',
}

function fail(error: { code?: string } | null): never {
  throw new AuthError(CODES[error?.code ?? ''] ?? 'network')
}

/** Accounts on Supabase Auth, profiles in the `profiles` table (see supabase/migrations). */
export function createSupabaseAuth(getClient: () => Promise<SupabaseClient>): AuthService {
  async function loadProfile(client: SupabaseClient, user: User): Promise<Profile> {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (error) fail(error)
    if (data) return fromRow(data as ProfileRow)
    const pseudo = String(
      user.user_metadata?.pseudo ?? user.email?.split('@')[0] ?? 'Joueur',
    ).slice(0, 24)
    const avatar = randomFreeAvatar()
    const profile = defaultProfile(user.id, pseudo, avatar)
    const { error: insertError } = await client.from('profiles').upsert(toRow(profile))
    if (insertError) fail(insertError)
    return profile
  }

  async function loadPremium(
    client: SupabaseClient,
    user: User,
  ): Promise<{ until: string | null; trial: boolean }> {
    const { data, error } = await client
      .from('entitlements')
      .select('premium_until, trial')
      .eq('user_id', user.id)
      .maybeSingle()
    const row = error ? null : (data as { premium_until: string | null; trial?: boolean } | null)
    return { until: row?.premium_until ?? null, trial: row?.trial === true }
  }

  const toSession = async (client: SupabaseClient, user: User): Promise<Session> => {
    const profile = await loadProfile(client, user)
    const premium = await loadPremium(client, user)
    return {
      account: { id: user.id, email: user.email ?? '' },
      profile,
      premiumUntil: premium.until,
      premiumTrial: premium.trial,
    }
  }

  return {
    async current() {
      const client = await getClient()
      const { data } = await client.auth.getSession()
      return data.session ? toSession(client, data.session.user) : null
    },
    async signUp(email, password, pseudo) {
      checkCredentials(email, password)
      const client = await getClient()
      const { data, error } = await client.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: { data: { pseudo } },
      })
      if (error) fail(error)
      if (!data.session || !data.user) throw new AuthError('confirmEmail')
      return toSession(client, data.user)
    },
    async signIn(email, password) {
      const client = await getClient()
      const { data, error } = await client.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      })
      if (error) fail(error)
      return toSession(client, data.session!.user)
    },
    async signOut() {
      const client = await getClient()
      await client.auth.signOut()
    },
    async saveProfile(profile) {
      const client = await getClient()
      const { error } = await client
        .from('profiles')
        .upsert({ ...toRow(profile), updated_at: new Date().toISOString() })
      if (error) fail(error)
      return profile
    },
    async saveStats(id, stats) {
      const client = await getClient()
      const { error } = await client
        .from('profiles')
        .update({ stats, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) fail(error)
    },
    async recordRoomGame(code, gameId) {
      const client = await getClient()
      const { error } = await client.rpc('record_room_game', { p_code: code, p_game_id: gameId })
      return !error
    },
  }
}
