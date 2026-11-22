import { AVATARS } from '@/content/avatars'
import { newId } from '@/lib/id'
import { safeStorage } from '@/lib/safeStorage'
import {
  AuthError,
  checkCredentials,
  defaultProfile,
  normalizeEmail,
  type AuthService,
  type Profile,
  type Session,
} from './authService'

/**
 * Accounts kept on this device only — used for development, tests and when no
 * Supabase project is configured. Passwords are stored as salted SHA-256 hashes.
 */
interface StoredAccount {
  id: string
  email: string
  salt: string
  hash: string
  profile: Profile
}

const ACCOUNTS = 'av:accounts'
const SESSION = 'av:session'

function readAccounts(): StoredAccount[] {
  try {
    const parsed: unknown = JSON.parse(safeStorage.getItem(ACCOUNTS) as string)
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : []
  } catch {
    return []
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  safeStorage.setItem(ACCOUNTS, JSON.stringify(accounts))
}

async function hash(password: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

const toSession = (a: StoredAccount): Session => ({
  account: { id: a.id, email: a.email },
  profile: a.profile,
})

export function createLocalAuth(): AuthService {
  return {
    async current() {
      const id = safeStorage.getItem(SESSION)
      const account = readAccounts().find((a) => a.id === id)
      return account ? toSession(account) : null
    },
    async signUp(email, password, pseudo) {
      checkCredentials(email, password)
      const accounts = readAccounts()
      const normalized = normalizeEmail(email)
      if (accounts.some((a) => a.email === normalized)) throw new AuthError('emailTaken')
      const id = newId('account')
      const salt = newId('salt')
      const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)]?.id ?? ''
      const stored: StoredAccount = {
        id,
        email: normalized,
        salt,
        hash: await hash(password, salt),
        profile: defaultProfile(id, pseudo, avatar),
      }
      writeAccounts([...accounts, stored])
      safeStorage.setItem(SESSION, id)
      return toSession(stored)
    },
    async signIn(email, password) {
      const account = readAccounts().find((a) => a.email === normalizeEmail(email))
      if (!account || (await hash(password, account.salt)) !== account.hash) {
        throw new AuthError('badCredentials')
      }
      safeStorage.setItem(SESSION, account.id)
      return toSession(account)
    },
    async signOut() {
      safeStorage.removeItem(SESSION)
    },
    async saveProfile(profile) {
      writeAccounts(readAccounts().map((a) => (a.id === profile.id ? { ...a, profile } : a)))
      return profile
    },
  }
}
