import { act } from '@testing-library/react'
import { accountStore } from '@/features/account/accountStore'
import { createLocalPayments } from './localPayments'
import { isPremium } from './premium'
import { endTrial } from './testing'

beforeEach(async () => {
  await act(() => accountStore.getState().signOut())
  await act(() =>
    accountStore.getState().signUp(`p-${Date.now()}@example.com`, 'motdepasse', 'Awa'),
  )
})
const until = () => accountStore.getState().session!.premiumUntil

test('after the trial, the account is not Premium', async () => {
  await endTrial()
  expect(isPremium(until())).toBe(false)
})

test('a test payment on this device grants the plan, and it survives a reload', async () => {
  await endTrial()
  const payments = createLocalPayments()
  const result = await payments.checkout('pass')
  expect(result).toEqual({ kind: 'granted' })
  await act(() => accountStore.getState().refreshPremium())
  expect(isPremium(until())).toBe(true)
  await act(() => accountStore.getState().init())
  expect(isPremium(until())).toBe(true)
})

test('buying again extends the end date', async () => {
  const payments = createLocalPayments()
  await payments.checkout('pass')
  await act(() => accountStore.getState().refreshPremium())
  const first = Date.parse(until()!)
  await payments.checkout('month')
  await act(() => accountStore.getState().refreshPremium())
  expect(Date.parse(until()!) - first).toBeCloseTo(30 * 24 * 3600e3, -4)
})
