import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import type { Signal, SignalTransport } from './types'

/**
 * Signalling over Supabase Realtime broadcast, on the private channel "live:<code>":
 * only room members may read or write it (see supabase/migrations/0005_live_video.sql).
 */
export function createSupabaseSignals(getClient: () => Promise<SupabaseClient>): SignalTransport {
  const channels = new Map<string, Promise<RealtimeChannel>>()
  const listeners = new Map<string, Set<(signal: Signal) => void>>()

  function channel(code: string): Promise<RealtimeChannel> {
    const existing = channels.get(code)
    if (existing) return existing
    const ready = getClient().then(async (client) => {
      await client.realtime.setAuth?.()
      return new Promise<RealtimeChannel>((resolve) => {
        const ch = client
          .channel(`live:${code}`, { config: { private: true, broadcast: { self: false } } })
          .on('broadcast', { event: 'signal' }, ({ payload }) => {
            listeners.get(code)?.forEach((l) => l(payload as Signal))
          })
        ch.subscribe((status) => {
          if (status === 'SUBSCRIBED') resolve(ch)
        })
      })
    })
    channels.set(code, ready)
    return ready
  }

  return {
    send: (code, signal) => {
      void channel(code).then((ch) =>
        ch.send({ type: 'broadcast', event: 'signal', payload: signal }),
      )
    },
    onSignal: (code, selfId, listener) => {
      const filtered = (signal: Signal) => {
        if (signal.to === selfId) listener(signal)
      }
      const set = listeners.get(code) ?? new Set()
      set.add(filtered)
      listeners.set(code, set)
      void channel(code)
      return () => {
        set.delete(filtered)
      }
    },
  }
}
