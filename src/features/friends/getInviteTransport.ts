import { createBroadcastBus } from '@/features/room/bus'
import { getSupabase, supabaseConfig } from '@/lib/backend'
import type { InviteTransport } from './invites'
import { createLocalInvites } from './localInvites'
import { createSupabaseInvites } from './supabaseInvites'

let transport: InviteTransport | null = null

/** Invitations: Supabase when configured; otherwise tabs of this browser. */
export function getInviteTransport(): InviteTransport {
  if (!transport) {
    const config = supabaseConfig()
    transport = config
      ? createSupabaseInvites(() => getSupabase(config))
      : createLocalInvites(createBroadcastBus())
  }
  return transport
}
