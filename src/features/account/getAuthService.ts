import type { AuthService } from './authService'
import { createLocalAuth } from './localAuth'

let service: AuthService | null = null

/** The auth backend: local accounts until a Supabase project is configured (see supabaseAuth). */
export function getAuthService(): AuthService {
  service ??= createLocalAuth()
  return service
}

/** Test seam: swap the backend. */
export function setAuthService(next: AuthService): void {
  service = next
}
