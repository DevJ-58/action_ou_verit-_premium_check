import { CATEGORIES } from '@/content/categories'
import {
  FREE_LIMITS,
  PLANS,
  extendPremium,
  isPremium,
  premiumCategories,
  allowedCategories,
} from './premium'

const NOW = Date.parse('2026-11-23T20:00:00Z')

test('the plans: evening pass 300 FCFA for 24 h, one month 1 500 FCFA for 30 days', () => {
  expect(PLANS.pass).toMatchObject({ price: 300, currency: 'XOF', hours: 24 })
  expect(PLANS.month).toMatchObject({ price: 1500, currency: 'XOF', hours: 30 * 24 })
})

test('premium is active until its end date', () => {
  expect(isPremium(null, NOW)).toBe(false)
  expect(isPremium(new Date(NOW + 1000).toISOString(), NOW)).toBe(true)
  expect(isPremium(new Date(NOW - 1000).toISOString(), NOW)).toBe(false)
})

test('a purchase extends from now, or from the current end if still active', () => {
  expect(extendPremium(null, 'pass', NOW)).toBe(new Date(NOW + 24 * 3600e3).toISOString())
  const active = new Date(NOW + 10 * 3600e3).toISOString()
  expect(extendPremium(active, 'pass', NOW)).toBe(new Date(NOW + 34 * 3600e3).toISOString())
})

test('free players keep 3 categories and 5 own dares; rooms of 6', () => {
  expect(FREE_LIMITS).toEqual({ customDares: 5, roomMembers: 6 })
  expect(premiumCategories()).toEqual(['closer', 'spicy', 'night', 'intimate', 'noreturn'])
  expect(allowedCategories(false)).toEqual(['fun', 'honest', 'romantic'])
  expect(allowedCategories(true)).toEqual(CATEGORIES.map((c) => c.id))
})
