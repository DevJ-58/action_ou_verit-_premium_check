import { Crown } from 'lucide-react'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'

/** Small gold “Premium” pill. */
export function PremiumBadge({ className }: { className?: string }) {
  const t = useT()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold tracking-[0.12em] text-on-gold uppercase',
        className,
      )}
    >
      <Crown aria-hidden="true" size={11} />
      {t.premium.badge}
    </span>
  )
}
