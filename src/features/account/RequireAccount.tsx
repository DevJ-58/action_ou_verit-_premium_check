import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { accountStore, useAccount } from './accountStore'

/** Lets signed-in players through; others go to the account screen and come back after. */
export function RequireAccount() {
  const status = useAccount((s) => s.status)
  const location = useLocation()
  useEffect(() => {
    if (status === 'loading') void accountStore.getState().init()
  }, [status])
  if (status === 'loading') return <div role="status" aria-busy="true" className="min-h-dvh" />
  if (status === 'signedOut') {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/compte?next=${next}`} replace />
  }
  return <Outlet />
}
