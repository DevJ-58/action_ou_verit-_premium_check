import { useEffect } from 'react'
import { accountStore, useAccount } from './accountStore'

/** Knows who is signed in from the first screen (Premium theme, invitations…). */
export function useAccountBoot(): void {
  const status = useAccount((s) => s.status)
  useEffect(() => {
    if (status === 'loading') void accountStore.getState().init()
  }, [status])
}
