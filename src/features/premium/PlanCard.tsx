import { Button } from '@/design-system'
import { format } from '@/i18n/format'
import { useSettings } from '@/features/settings/settingsStore'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'
import { formatFcfa, formatPrice, PLANS, totalToPay, type PlanId } from './premium'

export interface PlanCardProps {
  plan: PlanId
  busy: boolean
  disabled: boolean
  onBuy(): void
}

/** One plan: name, length, price and its Pay button. */
export function PlanCard({ plan, busy, disabled, onBuy }: PlanCardProps) {
  const t = useT()
  const language = useSettings((s) => s.language)
  const info = t.premium.plans[plan]
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB'
  const price = formatPrice(PLANS[plan], locale)
  const total = totalToPay(plan)
  const fees = formatFcfa(total - PLANS[plan].price, locale)
  const best = plan === 'month'
  return (
    <article
      className={cn(
        'relative flex flex-col gap-3 rounded-[26px] border-[1.5px] p-5',
        best ? 'border-gold bg-seat' : 'border-line',
      )}
    >
      {best ? (
        <span className="absolute -top-3 right-5 rounded-full bg-gold px-3 py-1 text-[11px] font-extrabold tracking-[0.12em] text-on-gold uppercase">
          {t.premium.plans.month.best}
        </span>
      ) : null}
      <div>
        <h3 className="text-lg font-extrabold">{info.name}</h3>
        <p className="text-sm text-muted">{info.length}</p>
      </div>
      <div>
        <p className="font-display text-[40px] leading-none">{price}</p>
        <p className="mt-1 text-sm text-muted">{format(t.premium.fees, { fees })}</p>
      </div>
      <Button
        size="lg"
        variant={best ? 'primary' : 'ghost'}
        loading={busy}
        disabled={disabled}
        onClick={onBuy}
      >
        {format(t.premium.buy, { price: formatFcfa(total, locale) })}
      </Button>
    </article>
  )
}
