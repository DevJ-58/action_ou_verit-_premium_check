import { Link } from 'react-router'
import { Crown } from 'lucide-react'
import { Emoji, Sheet } from '@/design-system'
import { useT } from '@/i18n/useT'

export interface PremiumSheetProps {
  open: boolean
  onClose(): void
  reason: string
  /** Off during a room game: leaving the screen would leave the game. */
  showLink?: boolean
}

/** Explains why something is locked, and leads to the Premium page. */
export function PremiumSheet({ open, onClose, reason, showLink = true }: PremiumSheetProps) {
  const t = useT()
  return (
    <Sheet open={open} onClose={onClose} title={t.premium.name}>
      <div className="flex flex-col items-center gap-4 pb-2 text-center">
        <Emoji name="crown" size={64} />
        <p className="max-w-xs text-lg font-semibold">{reason}</p>
        <p className="max-w-xs text-sm text-muted">{t.premium.shared}</p>
        {showLink ? (
          <Link
            to="/premium"
            className="inline-flex min-h-14 items-center gap-2 rounded-full bg-gold px-6 font-extrabold text-on-gold"
          >
            <Crown aria-hidden="true" size={18} />
            {t.premium.see}
          </Link>
        ) : null}
      </div>
    </Sheet>
  )
}
