import { createBroadcastBus } from '@/features/room/bus'
import { getSupabase, supabaseConfig } from '@/lib/backend'
import { createLocalSignals } from './localSignals'
import { createSupabaseSignals } from './supabaseSignals'
import type { SignalTransport } from './types'

let transport: SignalTransport | null = null

/** Live video signalling: Supabase when configured; otherwise tabs of this browser. */
export function getSignalTransport(): SignalTransport {
  if (!transport) {
    const config = supabaseConfig()
    transport = config
      ? createSupabaseSignals(() => getSupabase(config))
      : createLocalSignals(createBroadcastBus())
  }
  return transport
}
