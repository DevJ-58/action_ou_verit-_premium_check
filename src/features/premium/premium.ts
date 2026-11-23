import { CATEGORIES } from '@/content/categories'
import type { CategoryId } from '@/engine'

export type PlanId = 'pass' | 'month'

export interface Plan {
  id: PlanId
  price: number
  currency: 'XOF'
  hours: number
}

/** What can be bought. Prices in FCFA (XOF). No automatic renewal. */
export const PLANS: Record<PlanId, Plan> = {
  pass: { id: 'pass', price: 300, currency: 'XOF', hours: 24 },
  month: { id: 'month', price: 1500, currency: 'XOF', hours: 30 * 24 },
}

/** Every new account starts with this many days of free Premium. */
export const TRIAL_DAYS = 7

/** Whole days left before `until` (rounded up, never negative). */
export function trialDaysLeft(until: string | null | undefined, now = Date.now()): number {
  if (!until) return 0
  return Math.max(0, Math.ceil((Date.parse(until) - now) / 86400e3))
}

/**
 * Payment fees, paid by the player on top of the price: GeniusPay takes 1 % + 100 FCFA per
 * successful payment, and the Mobile Money operator about 1.5 % more (e.g. Wave).
 */
export const PAYMENT_FEES = { rate: 0.025, fixed: 100 } as const

/** What the player pays for a plan, fees included, rounded up to 5 FCFA. */
export function totalToPay(plan: PlanId): number {
  const gross = (PLANS[plan].price + PAYMENT_FEES.fixed) / (1 - PAYMENT_FEES.rate)
  return Math.ceil(gross / 5) * 5
}

/** What a free player gets. */
export const FREE_LIMITS = { customDares: 5, roomMembers: 6 } as const

export function isPremium(until: string | null | undefined, now = Date.now()): boolean {
  return Boolean(until) && Date.parse(until!) > now
}

/** New end date after buying a plan: from now, or from the current end if still running. */
export function extendPremium(until: string | null, plan: PlanId, now = Date.now()): string {
  const from = until && Date.parse(until) > now ? Date.parse(until) : now
  return new Date(from + PLANS[plan].hours * 3600e3).toISOString()
}

export function premiumCategories(): CategoryId[] {
  return CATEGORIES.filter((c) => !c.free).map((c) => c.id)
}

export function allowedCategories(premium: boolean): CategoryId[] {
  return CATEGORIES.filter((c) => premium || c.free).map((c) => c.id)
}

export function formatFcfa(amount: number, locale: string): string {
  return `${amount.toLocaleString(locale)} FCFA`
}

export function formatPrice(plan: Plan, locale: string): string {
  return formatFcfa(plan.price, locale)
}
