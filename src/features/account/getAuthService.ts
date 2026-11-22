import { getSupabase, supabaseConfig } from '@/lib/backend'
import type { AuthService } from './authService'
import { createLocalAuth } from './localAuth'
import { createSupabaseAuth } from './supabaseAuth'

let service: AuthService | null = null

/** Supabase accounts when configured; otherwise accounts kept on this device. */
export function getAuthService(): AuthService {
  if (!service) {
    const config = supabaseConfig()
    service = config ? createSupabaseAuth(() => getSupabase(config)) : createLocalAuth()
  }
  return service
}

/** Test seam: swap the backend. */
export function setAuthService(next: AuthService): void {
  service = next
}
