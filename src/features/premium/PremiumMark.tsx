import { Crown } from 'lucide-react'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'

/** Small gold crown marking a Premium element. `corner`: pinned to the top-right of a round button. */
export function PremiumMark({
  corner = false,
  className,
}: {
  corner?: boolean
  className?: string
}) {
  const t = useT()
  return (
    <span
      role="img"
      aria-label={t.premium.name}
      title={t.premium.name}
      className={cn(
        'inline-grid size-4.5 shrink-0 place-items-center rounded-full bg-gold text-on-gold',
        corner && 'pointer-events-none absolute -top-1 -right-1 ring-2 ring-bg',
        className,
      )}
    >
      <Crown aria-hidden="true" size={10} strokeWidth={2.6} />
    </span>
  )
}
