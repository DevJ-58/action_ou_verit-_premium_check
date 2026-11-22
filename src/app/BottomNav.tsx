import { NavLink } from 'react-router'
import { Layers, Star, UserRound, Users } from 'lucide-react'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'

export function BottomNav() {
  const t = useT()
  const items = [
    { to: '/', label: t.nav.play, icon: Layers, end: true },
    { to: '/joueurs', label: t.nav.players, icon: Users, end: false },
    { to: '/defis', label: t.nav.dares, icon: Star, end: false },
    { to: '/profil', label: t.nav.profile, icon: UserRound, end: false },
  ]
  return (
    <nav
      aria-label={t.nav.label}
      className="sticky bottom-0 border-t border-line bg-bg pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <ul className="mx-auto flex max-w-lg justify-around px-2 pt-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-12 min-w-18 flex-col items-center gap-1 text-xs',
                  isActive ? 'font-extrabold text-gold-text' : 'font-semibold text-muted',
                )
              }
            >
              <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
