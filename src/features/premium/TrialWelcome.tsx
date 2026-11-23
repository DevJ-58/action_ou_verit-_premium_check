import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Button, Emoji, Sheet } from '@/design-system'
import type { EmojiName } from '@/content/emoji'
import { useAccount } from '@/features/account/accountStore'
import { useSettings } from '@/features/settings/settingsStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { safeStorage } from '@/lib/safeStorage'
import { isPremium } from './premium'

const seenKey = (id: string) => `av:trial-welcome:${id}`
const HIGHLIGHTS: { key: 'categories' | 'live' | 'rooms' | 'voice'; emoji: EmojiName }[] = [
  { key: 'categories', emoji: 'fire' },
  { key: 'live', emoji: 'eyes' },
  { key: 'rooms', emoji: 'people' },
  { key: 'voice', emoji: 'speech' },
]

/** “Congratulations, you have Premium for 7 days”: once per account, during its free trial. */
export function TrialWelcome() {
  const t = useT()
  const still = useReducedMotion() ?? false
  const language = useSettings((s) => s.language)
  const id = useAccount((s) => s.session?.account.id ?? null)
  const until = useAccount((s) => s.session?.premiumUntil ?? null)
  const trial = useAccount((s) => s.session?.premiumTrial === true)
  const [closedFor, setClosedFor] = useState<string | null>(null)
  const open =
    Boolean(id) &&
    trial &&
    isPremium(until) &&
    closedFor !== id &&
    safeStorage.getItem(seenKey(id ?? '')) === null

  const close = () => {
    if (!id) return
    safeStorage.setItem(seenKey(id), '1')
    setClosedFor(id)
  }
  const date = until
    ? new Date(until).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', {
        day: 'numeric',
        month: 'long',
      })
    : ''

  return (
    <Sheet open={open} onClose={close} title={t.premium.welcomeTitle}>
      <div className="flex flex-col items-center gap-4 pb-2 text-center">
        <motion.div
          className="flex items-end gap-1"
          initial={still ? false : { scale: 0.4, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 12 }}
        >
          <Emoji name="party" size={56} />
          <Emoji name="crown" size={76} />
          <Emoji name="sparkles" size={56} />
        </motion.div>
        <p className="max-w-xs text-lg font-semibold">{format(t.premium.welcomeBody, { date })}</p>
        <div className="w-full max-w-sm text-left">
          <p className="text-xs font-extrabold tracking-[0.14em] text-gold-text uppercase">
            {t.premium.welcomeList}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {HIGHLIGHTS.map((h) => (
              <li key={h.key} className="flex items-start gap-2.5 text-sm font-semibold">
                <Emoji name={h.emoji} size={24} className="shrink-0" />
                <span className="pt-0.5">{t.premium.features[h.key]}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button size="lg" className="w-full max-w-sm" onClick={close}>
          {t.premium.welcomeCta}
        </Button>
      </div>
    </Sheet>
  )
}
