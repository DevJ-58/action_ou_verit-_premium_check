import { Outlet } from 'react-router'
import { BottomNav } from './BottomNav'

/** Layout of the four main tabs: content plus the bottom navigation. */
export function TabsLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
