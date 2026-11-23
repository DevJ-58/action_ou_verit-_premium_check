import { createBroadcastBus } from '@/features/room/bus'
import { getSupabase, supabaseConfig } from '@/lib/backend'
import { createLocalSocial } from './localSocial'
import type { SocialService } from './social'
import { createSupabaseSocial } from './supabaseSocial'

let service: SocialService | null = null

/** Friend requests and public profiles: Supabase when configured; otherwise this browser. */
export function getSocial(): SocialService {
  if (!service) {
    const config = supabaseConfig()
    service = config
      ? createSupabaseSocial(() => getSupabase(config))
      : createLocalSocial(createBroadcastBus())
  }
  return service
}

/** Test seam. */
export function setSocial(next: SocialService | null): void {
  service = next
}
