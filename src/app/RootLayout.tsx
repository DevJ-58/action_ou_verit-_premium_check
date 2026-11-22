import { Outlet } from 'react-router'
import { useApplySettings } from '@/features/settings/useApplySettings'

export function RootLayout() {
  useApplySettings()
  return <Outlet />
}
