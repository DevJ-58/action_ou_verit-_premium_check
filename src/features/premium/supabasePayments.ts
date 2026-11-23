import type { SupabaseClient } from '@supabase/supabase-js'
import type { PaymentService } from './payments'

const CHECKOUT_HOST = /^https:\/\/([a-z0-9-]+\.)*geniuspay\.ci\//

/**
 * Payments through the Supabase Edge Function `geniuspay` (supabase/functions/geniuspay):
 * it opens a GeniusPay checkout page, and checks payments when the player comes back.
 */
export function createSupabasePayments(getClient: () => Promise<SupabaseClient>): PaymentService {
  return {
    async checkout(plan) {
      try {
        const client = await getClient()
        const { data, error } = await client.functions.invoke('geniuspay', {
          body: { action: 'create', plan },
        })
        if (error) {
          const status = (error as { context?: { status?: number } }).context?.status
          return status === 404 || status === 503 ? { kind: 'unavailable' } : { kind: 'failed' }
        }
        const url = (data as { url?: unknown } | null)?.url
        return typeof url === 'string' && CHECKOUT_HOST.test(url)
          ? { kind: 'redirect', url }
          : { kind: 'failed' }
      } catch {
        return { kind: 'failed' }
      }
    },
    async verify() {
      try {
        const client = await getClient()
        await client.functions.invoke('geniuspay', { body: { action: 'verify' } })
      } catch {
        // The thank-you screen keeps polling; the webhook may also grant it.
      }
    },
  }
}
