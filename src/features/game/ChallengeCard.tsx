import type { Dare } from '@/engine'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { motion } from 'motion/react'
import { springs } from '@/design-system/motion'
import { cn } from '@/lib/cn'
import { dareTextSize } from './dareTextSize'

export interface ChallengeCardProps {
  dare: Dare
  rotation: 0 | 90 | 180 | 270
  byline: string
  /** Rooms: a shorter card so the answer and buttons stay in view. */
  compact?: boolean
}

// Sideways cards: long side along the screen height, short side along its width.
const SIDEWAYS_FRAME = 'relative h-[min(54dvh,440px)] w-[min(80vw,330px)]'
const SIDEWAYS_CARD =
  'absolute top-1/2 left-1/2 h-[min(80vw,330px)] w-[min(54dvh,440px)] -translate-x-1/2 -translate-y-1/2'
const UPRIGHT_FRAME = 'flex w-full max-w-[340px] justify-center'
const UPRIGHT_CARD = 'min-h-[min(56dvh,470px)] w-full'
const COMPACT_CARD = 'min-h-[min(38dvh,340px)] w-full min-[900px]:min-h-[min(60dvh,470px)]'

/** The dare as a luxury playing card, turned to face the player who must answer. */
export function ChallengeCard({ dare, rotation, byline, compact = false }: ChallengeCardProps) {
  const t = useT()
  const truth = dare.kind === 'truth'
  const letter = truth ? 'V' : 'A'
  const accent = truth ? 'text-ivory' : 'text-dare-ink'
  const sideways = rotation === 90 || rotation === 270
  return (
    <div data-sideways={sideways} className={sideways ? SIDEWAYS_FRAME : UPRIGHT_FRAME}>
      <motion.article
        key={dare.id}
        initial={{ opacity: 0, rotateY: -80, scale: 0.9 }}
        animate={{ opacity: 1, rotateY: 0, scale: 1 }}
        transition={springs.bouncy}
        data-rotation={rotation}
        style={{ rotate: `${rotation}deg` }}
        className={cn(
          'flex flex-col rounded-[22px] shadow-card transition-[rotate] duration-(--dur-slow) ease-(--ease-out-expo)',
          sideways
            ? `${SIDEWAYS_CARD} p-4.5`
            : `relative ${compact ? COMPACT_CARD : UPRIGHT_CARD} ${compact ? 'p-4.5' : 'p-5.5'}`,
          truth ? 'bg-truth text-ivory' : 'bg-card-ivory text-ink',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-2.25 rounded-[15px] border',
            truth ? 'border-[#e3b23c]' : 'border-card-rim',
          )}
        />
        <div className="relative flex items-start justify-between">
          <span aria-hidden="true" className={cn('font-display text-3xl leading-[0.9]', accent)}>
            {letter}
          </span>
          <span className="pt-1.5 text-[11px] font-extrabold tracking-[0.18em] uppercase">
            {t.categories[dare.category].name}
          </span>
        </div>
        <div aria-hidden="true" className="relative mt-4 flex h-2.5">
          {[3, 1, 2, 1, 3, 1, 2, 1, 3].map((flex, i) => (
            <span
              key={i}
              style={{ flex }}
              className={
                i % 2 === 1
                  ? 'bg-dare'
                  : i % 4 === 2
                    ? truth
                      ? 'bg-ink'
                      : 'bg-truth'
                    : 'bg-[#e3b23c]'
              }
            />
          ))}
        </div>
        <h2
          className={cn(
            'relative font-display leading-[0.95] font-normal',
            sideways ? 'mt-3 text-[38px]' : compact ? 'mt-3 text-[40px]' : 'mt-5 text-[54px]',
            accent,
          )}
        >
          {truth ? t.game.truth : t.game.dare}
        </h2>
        <p
          className={cn(
            'relative mt-3 min-h-0 flex-1 overflow-y-auto leading-[1.4] font-semibold tracking-[-0.01em]',
            dareTextSize(dare.text.length, sideways),
          )}
        >
          {dare.text}
        </p>
        <div className="relative mt-auto flex items-end justify-between pt-4">
          <span
            role="img"
            aria-label={format(t.game.intensity, { level: dare.intensity })}
            className="flex gap-1.5"
          >
            {[1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className={cn(
                  'size-2.5 rotate-45',
                  level <= dare.intensity
                    ? truth
                      ? 'bg-ivory'
                      : 'bg-dare-ink'
                    : 'border border-current opacity-40',
                )}
              />
            ))}
          </span>
          <span className="text-xs font-semibold opacity-80">{byline}</span>
        </div>
      </motion.article>
    </div>
  )
}
