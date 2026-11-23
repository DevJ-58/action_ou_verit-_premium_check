import { act } from '@testing-library/react'
import { accountStore } from '@/features/account/accountStore'
import { createLocalPayments } from './localPayments'
import { TRIAL_DAYS, isPremium, trialDaysLeft } from './premium'

beforeEach(async () => {
  await act(() => accountStore.getState().signOut())
  await act(() =>
    accountStore.getState().signUp(`t-${Date.now()}@example.com`, 'motdepasse', 'Awa'),
  )
})
const session = () => accountStore.getState().session!

test('a new account starts with 7 days of free Premium trial', () => {
  expect(TRIAL_DAYS).toBe(7)
  expect(isPremium(session().premiumUntil)).toBe(true)
  expect(session().premiumTrial).toBe(true)
  expect(trialDaysLeft(session().premiumUntil, Date.now())).toBe(7)
})

test('buying Premium during the trial ends the trial label and adds to it', async () => {
  const trialEnd = Date.parse(session().premiumUntil!)
  await createLocalPayments().checkout('pass')
  await act(() => accountStore.getState().refreshPremium())
  expect(session().premiumTrial).toBe(false)
  expect(Date.parse(session().premiumUntil!) - trialEnd).toBeCloseTo(24 * 3600e3, -4)
})

test('days left are rounded up and never negative', () => {
  const now = Date.parse('2026-11-23T12:00:00Z')
  expect(trialDaysLeft(new Date(now + 1.2 * 86400e3).toISOString(), now)).toBe(2)
  expect(trialDaysLeft(new Date(now - 1000).toISOString(), now)).toBe(0)
  expect(trialDaysLeft(null, now)).toBe(0)
})
