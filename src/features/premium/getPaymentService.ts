import { getSupabase, supabaseConfig } from '@/lib/backend'
import { createLocalPayments } from './localPayments'
import type { PaymentService } from './payments'
import { createSupabasePayments } from './supabasePayments'

let service: PaymentService | null = null

/** Payments: CinetPay through Supabase when configured; otherwise test payments on this device. */
export function getPaymentService(): PaymentService {
  if (!service) {
    const config = supabaseConfig()
    service = config ? createSupabasePayments(() => getSupabase(config)) : createLocalPayments()
  }
  return service
}

/** Test seam. */
export function setPaymentService(next: PaymentService | null): void {
  service = next
}
