import { useState } from 'react'
import { Link } from 'react-router'
import { X } from 'lucide-react'
import { Emoji } from '@/design-system'
import { useAccount } from '@/features/account/accountStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { safeStorage } from '@/lib/safeStorage'
import { isPremium, trialDaysLeft } from './premium'

const KEY = 'av:trial-notice'
const DAY = 86400e3
const today = () => new Date().toISOString().slice(0, 10)

/** On the home screen: the free trial ends soon, or has just ended. */
export function TrialNotice() {
  const t = useT()
  const until = useAccount((s) => s.session?.premiumUntil ?? null)
  const trial = useAccount((s) => s.session?.premiumTrial === true)
  const [closed, setClosed] = useState(() => safeStorage.getItem(KEY) === today())
  // Read the clock once when the screen opens (enough for a daily reminder).
  const [now] = useState(() => Date.now())
  if (!trial || !until || closed) return null
  const active = isPremium(until, now)
  const days = trialDaysLeft(until, now)
  const endedRecently = !active && now - Date.parse(until) < 14 * DAY
  if (!(active && days <= 2) && !endedRecently) return null

  return (
    <section className="flex items-center gap-3 rounded-[24px] border-[1.5px] border-gold p-3.5">
      <Emoji name={active ? 'hourglass' : 'crown'} size={40} className="shrink-0" />
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-extrabold">
          {active ? format(t.premium.trialEnding, { days }) : t.premium.trialEnded}
        </p>
        <Link
          to="/premium"
          className="text-sm font-bold text-gold-text underline underline-offset-4"
        >
          {t.premium.trialKeep}
        </Link>
      </div>
      <button
        type="button"
        aria-label={t.premium.dismiss}
        onClick={() => {
          safeStorage.setItem(KEY, today())
          setClosed(true)
        }}
        className="grid size-11 place-items-center rounded-full text-muted"
      >
        <X aria-hidden="true" size={18} />
      </button>
    </section>
  )
}
