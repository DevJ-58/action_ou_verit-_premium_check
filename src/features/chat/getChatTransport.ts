import { createBroadcastBus } from '@/features/room/bus'
import { getSupabase, supabaseConfig } from '@/lib/backend'
import { createLocalChat } from './localChat'
import { createSupabaseChat } from './supabaseChat'
import type { ChatTransport } from './types'

let transport: ChatTransport | null = null

/** The chat network: Supabase when configured; otherwise tabs of this browser. */
export function getChatTransport(): ChatTransport {
  if (!transport) {
    const config = supabaseConfig()
    transport = config
      ? createSupabaseChat(() => getSupabase(config))
      : createLocalChat(createBroadcastBus())
  }
  return transport
}

/** Test seam. */
export function setChatTransport(next: ChatTransport | null): void {
  transport = next
}
