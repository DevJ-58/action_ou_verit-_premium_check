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

export function formatPrice(plan: Plan, locale: string): string {
  return `${plan.price.toLocaleString(locale)} FCFA`
}
