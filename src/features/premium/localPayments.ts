import { accountStore } from '@/features/account/accountStore'
import { grantLocalPremium, localPremiumUntil } from '@/features/account/localAuth'
import type { PaymentService } from './payments'
import { extendPremium } from './premium'

/** Development and tests (no server): a test payment grants the plan on this device. */
export function createLocalPayments(): PaymentService {
  return {
    async checkout(plan) {
      const id = accountStore.getState().session?.account.id
      if (!id) return { kind: 'failed' }
      grantLocalPremium(id, extendPremium(localPremiumUntil(id), plan))
      return { kind: 'granted' }
    },
  }
}
