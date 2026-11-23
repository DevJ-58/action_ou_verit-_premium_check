import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Check } from 'lucide-react'
import { Emoji, LogoMark, Screen } from '@/design-system'
import type { EmojiName } from '@/content/emoji'
import { accountStore, useAccount } from '@/features/account/accountStore'
import { useSettings } from '@/features/settings/settingsStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { getPaymentService } from './getPaymentService'
import { PlanCard } from './PlanCard'
import { isPremium, type PlanId } from './premium'

const FEATURES: { key: keyof ReturnType<typeof useT>['premium']['features']; emoji: EmojiName }[] =
  [
    { key: 'categories', emoji: 'fire' },
    { key: 'live', emoji: 'eyes' },
    { key: 'rooms', emoji: 'people' },
    { key: 'voice', emoji: 'speech' },
    { key: 'dares', emoji: 'loveLetter' },
    { key: 'looks', emoji: 'sparkles' },
  ]

/** What Premium unlocks, the two plans, and buying one. */
export function PremiumScreen() {
  const t = useT()
  const navigate = useNavigate()
  const language = useSettings((s) => s.language)
  const status = useAccount((s) => s.status)
  const until = useAccount((s) => s.session?.premiumUntil ?? null)
  const signedIn = status === 'signedIn'
  const [busy, setBusy] = useState<PlanId | null>(null)
  const [problem, setProblem] = useState<'unavailable' | 'failed' | null>(null)

  useEffect(() => {
    if (status === 'loading') void accountStore.getState().init()
  }, [status])

  async function buy(plan: PlanId) {
    setBusy(plan)
    setProblem(null)
    const result = await getPaymentService().checkout(plan)
    setBusy(null)
    if (result.kind === 'redirect') return window.location.assign(result.url)
    if (result.kind === 'granted') return void accountStore.getState().refreshPremium()
    setProblem(result.kind)
  }

  const date = until
    ? new Date(until).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <Screen back={() => navigate(-1)} backLabel={t.common.back}>
      <div className="mx-auto flex w-full max-w-md flex-col gap-7 pt-2 pb-6">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="relative">
            <LogoMark size={92} />
            <Emoji name="crown" size={44} className="absolute -top-5 -right-4 rotate-12" />
          </span>
          <h1 className="font-display text-[44px] leading-none">{t.premium.title}</h1>
          <p className="text-muted">{t.premium.tagline}</p>
        </header>
        {isPremium(until) ? (
          <p
            role="status"
            className="flex items-center justify-center gap-2 rounded-[20px] bg-gold p-3 text-center font-extrabold text-on-gold"
          >
            <Check aria-hidden="true" size={18} />
            {format(t.premium.active, { date })}
          </p>
        ) : null}
        <ul className="flex flex-col gap-2.5">
          {FEATURES.map((f) => (
            <li key={f.key} className="flex items-start gap-3">
              <Emoji name={f.emoji} size={28} className="shrink-0" />
              <span className="pt-0.5 font-semibold">{t.premium.features[f.key]}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-gold-text">{t.premium.shared}</p>
        <div className="flex flex-col gap-4">
          {(['month', 'pass'] as const).map((plan) => (
            <PlanCard
              key={plan}
              plan={plan}
              busy={busy === plan}
              disabled={!signedIn || busy !== null}
              onBuy={() => void buy(plan)}
            />
          ))}
        </div>
        {problem ? (
          <p role="alert" className="text-center font-semibold text-dare">
            {problem === 'unavailable' ? t.premium.unavailable : t.premium.failed}
          </p>
        ) : null}
        {!signedIn && status !== 'loading' ? (
          <Link
            to="/compte?next=%2Fpremium"
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-6 font-extrabold text-on-gold"
          >
            {t.premium.signIn}
          </Link>
        ) : null}
        <p className="text-center text-xs text-muted">
          {t.premium.payWith}
          <br />
          {t.premium.noRenewal}
        </p>
      </div>
    </Screen>
  )
}
