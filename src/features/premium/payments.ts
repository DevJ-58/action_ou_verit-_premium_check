import type { PlanId } from './premium'

export type CheckoutResult =
  | { kind: 'redirect'; url: string }
  | { kind: 'granted' }
  | { kind: 'unavailable' }
  | { kind: 'failed' }

/** Buys a plan for the signed-in player. */
export interface PaymentService {
  checkout(plan: PlanId): Promise<CheckoutResult>
}
