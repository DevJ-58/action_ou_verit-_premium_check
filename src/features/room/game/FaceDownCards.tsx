import { motion } from 'motion/react'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'

export interface FaceDownCardsProps {
  count: number
  /** When given, cards can be turned over (the answerer); otherwise they are shown only. */
  onPick?: (index: number) => void
}

/** The proposals as face-down wax cards, fanned out. */
export function FaceDownCards({ count, onPick }: FaceDownCardsProps) {
  const t = useT()
  const spread = Math.min(14, 40 / Math.max(1, count))
  return (
    <div className="flex flex-wrap justify-center gap-3 py-4">
      {Array.from({ length: count }, (_, i) => {
        const tilt = (i - (count - 1) / 2) * spread
        const label = format(t.roomGame.card, { n: i + 1 })
        const face = (
          <span
            aria-hidden="true"
            className="block h-40 w-28 overflow-hidden rounded-[18px] border-[1.5px] border-[#e3b23c] bg-ink shadow-card"
          >
            <svg viewBox="0 0 112 160" className="size-full">
              <defs>
                <pattern id={`wax-${i}`} width="22" height="22" patternUnits="userSpaceOnUse">
                  <path
                    d="M11 2 L20 11 L11 20 L2 11 Z"
                    fill="none"
                    stroke="#e3b23c"
                    strokeWidth="1.2"
                  />
                  <circle cx="11" cy="11" r="2.2" fill="#e05a2b" />
                </pattern>
              </defs>
              <rect x="7" y="7" width="98" height="146" rx="10" fill={`url(#wax-${i})`} />
            </svg>
          </span>
        )
        return (
          <motion.div
            key={i}
            initial={{ y: 40, opacity: 0, rotate: 0 }}
            animate={{ y: 0, opacity: 1, rotate: tilt }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 260, damping: 18 }}
          >
            {onPick ? (
              <motion.button
                type="button"
                aria-label={label}
                whileHover={{ y: -10 }}
                whileTap={{ scale: 0.92, rotateY: 90 }}
                onClick={() => onPick(i)}
                className="block rounded-[18px]"
              >
                {face}
              </motion.button>
            ) : (
              <span role="img" aria-label={label} className="block">
                {face}
              </span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
