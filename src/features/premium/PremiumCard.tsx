import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Emoji } from '@/design-system'
import { useAccount } from '@/features/account/accountStore'
import { useSettings } from '@/features/settings/settingsStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'
import { isPremium } from './premium'

/** On the profile: Premium status, or the way to it. */
export function PremiumCard() {
  const t = useT()
  const language = useSettings((s) => s.language)
  const until = useAccount((s) => s.session?.premiumUntil ?? null)
  const active = isPremium(until)
  const date = until
    ? new Date(until).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', {
        day: 'numeric',
        month: 'long',
      })
    : ''
  return (
    <Link
      to="/premium"
      className={cn(
        'flex min-h-18 items-center gap-3 rounded-[22px] px-4 py-3',
        active ? 'border-[1.5px] border-gold' : 'bg-gold text-on-gold',
      )}
    >
      <Emoji name="crown" size={38} />
      <span className="flex-1">
        <span className="block font-extrabold">{active ? t.premium.name : t.premium.title}</span>
        <span className={cn('block text-sm', active ? 'text-muted' : 'text-on-gold/80')}>
          {active ? format(t.premium.active, { date }) : t.premium.tagline}
        </span>
      </span>
      <ChevronRight aria-hidden="true" size={20} />
    </Link>
  )
}
