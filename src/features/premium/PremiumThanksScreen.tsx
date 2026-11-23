import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Emoji, Screen } from '@/design-system'
import { accountStore, useAccount } from '@/features/account/accountStore'
import { useSettings } from '@/features/settings/settingsStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { getPaymentService } from './getPaymentService'
import { isPremium } from './premium'

const POLL_MS = 3000
const GIVE_UP_MS = 90_000

/** Back from the payment page: waits until the server has confirmed the payment. */
export function PremiumThanksScreen() {
  const t = useT()
  const language = useSettings((s) => s.language)
  const status = useAccount((s) => s.status)
  const until = useAccount((s) => s.session?.premiumUntil ?? null)
  const premium = isPremium(until)
  const [gaveUp, setGaveUp] = useState(false)

  useEffect(() => {
    if (status === 'loading') void accountStore.getState().init()
  }, [status])

  useEffect(() => {
    if (premium || status !== 'signedIn') return
    const check = async () => {
      await getPaymentService().verify()
      await accountStore.getState().refreshPremium()
    }
    void check()
    const poll = setInterval(() => void check(), POLL_MS)
    const stop = setTimeout(() => setGaveUp(true), GIVE_UP_MS)
    return () => {
      clearInterval(poll)
      clearTimeout(stop)
    }
  }, [premium, status])

  const date = until
    ? new Date(until).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', {
        day: 'numeric',
        month: 'long',
      })
    : ''

  return (
    <Screen>
      <div className="m-auto flex max-w-sm flex-col items-center gap-4 text-center">
        <Emoji
          name={premium ? 'party' : 'hourglass'}
          size={80}
          className={premium ? undefined : 'motion-safe:animate-bounce'}
        />
        <h1 className="font-display text-[44px] leading-none">{t.premium.thanksTitle}</h1>
        <p role="status" className="text-lg font-semibold">
          {premium
            ? format(t.premium.done, { date })
            : gaveUp
              ? t.premium.notYet
              : t.premium.checking}
        </p>
        <Link
          to="/"
          className="mt-2 inline-flex min-h-14 items-center rounded-full bg-gold px-8 font-extrabold text-on-gold"
        >
          {t.premium.play}
        </Link>
      </div>
    </Screen>
  )
}
