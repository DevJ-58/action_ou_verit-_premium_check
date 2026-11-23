import { motion } from 'motion/react'
import type { GameState } from '@/engine'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'
import { turnGuide } from './turnGuide'

export interface TurnGuideBarProps {
  game: GameState
  selfId: string
  nameOf(id: string): string
}

/** The five steps of the turn, and in one line what is happening and who must act. */
export function TurnGuideBar({ game, selfId, nameOf }: TurnGuideBarProps) {
  const t = useT()
  const guide = turnGuide(game, selfId, nameOf, t)
  return (
    <section aria-label={t.guide.label} className="flex flex-col gap-2">
      <ol className="flex items-center gap-1">
        {t.guide.steps.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col items-center gap-1">
            <span
              aria-hidden="true"
              className={cn(
                'h-1.5 w-full rounded-full transition-colors',
                i < guide.step ? 'bg-gold/50' : i === guide.step ? 'bg-gold' : 'bg-line',
              )}
            />
            <span
              aria-current={i === guide.step ? 'step' : undefined}
              className={cn(
                'text-[10px] font-extrabold tracking-[0.08em] uppercase',
                i === guide.step ? 'text-gold-text' : 'text-muted max-[359px]:sr-only',
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
      <motion.p
        key={guide.text}
        role="status"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-[16px] px-3.5 py-2 text-center text-sm font-bold',
          guide.mine ? 'bg-gold text-on-gold' : 'bg-seat text-text',
        )}
      >
        {guide.text}
      </motion.p>
    </section>
  )
}
