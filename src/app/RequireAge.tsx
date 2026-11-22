import { Navigate, Outlet } from 'react-router'
import { useSettings } from '@/features/settings/settingsStore'

/** Only lets adults who confirmed their age through. */
export function RequireAge() {
  const confirmed = useSettings((s) => s.ageConfirmedAt !== null)
  return confirmed ? <Outlet /> : <Navigate to="/bienvenue" replace />
}
