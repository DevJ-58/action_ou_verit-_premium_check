import type { SupabaseClient } from '@supabase/supabase-js'
import type { PaymentService } from './payments'

const CHECKOUT_HOST = /^https:\/\/([a-z0-9-]+\.)*cinetpay\.com\//

/**
 * Payments through the Supabase Edge Function `create-payment`
 * (supabase/functions/create-payment): it opens a CinetPay transaction and returns its page.
 */
export function createSupabasePayments(getClient: () => Promise<SupabaseClient>): PaymentService {
  return {
    async checkout(plan) {
      try {
        const client = await getClient()
        const returnUrl = `${window.location.origin}${import.meta.env.BASE_URL}premium/merci`
        const { data, error } = await client.functions.invoke('create-payment', {
          body: { plan, returnUrl },
        })
        if (error) {
          const status = (error as { context?: { status?: number } }).context?.status
          return status === 404 ? { kind: 'unavailable' } : { kind: 'failed' }
        }
        const url = (data as { url?: unknown } | null)?.url
        return typeof url === 'string' && CHECKOUT_HOST.test(url)
          ? { kind: 'redirect', url }
          : { kind: 'failed' }
      } catch {
        return { kind: 'failed' }
      }
    },
  }
}
