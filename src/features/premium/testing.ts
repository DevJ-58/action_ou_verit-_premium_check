// Test helper (imported by *.test.* only): ends the free trial of the signed-in local account.
import { act } from '@testing-library/react'
import { accountStore } from '@/features/account/accountStore'
import { grantLocalPremium } from '@/features/account/localAuth'

export async function endTrial(): Promise<void> {
  const id = accountStore.getState().session!.account.id
  grantLocalPremium(id, new Date(0).toISOString())
  await act(() => accountStore.getState().refreshPremium())
}
