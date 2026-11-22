import type { Dare } from '@/engine'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'

export interface ChallengeCardProps {
  dare: Dare
  rotation: 0 | 90 | 180 | 270
  byline: string
}

const SIDEWAYS = 'h-[min(78vw,330px)] w-[min(62dvh,440px)]'
const UPRIGHT = 'min-h-[min(56dvh,470px)] w-full max-w-[340px]'

/** The dare as a luxury playing card, turned to face the player who must answer. */
export function ChallengeCard({ dare, rotation, byline }: ChallengeCardProps) {
  const t = useT()
  const truth = dare.kind === 'truth'
  const letter = truth ? 'V' : 'A'
  const accent = truth ? 'text-ivory' : 'text-dare-ink'
  const sideways = rotation === 90 || rotation === 270
  return (
    <article
      data-rotation={rotation}
      style={{ transform: `rotate(${rotation}deg)` }}
      className={cn(
        'relative flex flex-col rounded-[22px] p-5.5 shadow-card transition-transform duration-(--dur-slow) ease-(--ease-out-expo)',
        sideways ? SIDEWAYS : UPRIGHT,
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
        className={cn('relative mt-5 font-display text-[54px] leading-[0.95] font-normal', accent)}
      >
        {truth ? t.game.truth : t.game.dare}
      </h2>
      <p className="relative mt-3 text-[22px] leading-[1.4] font-semibold tracking-[-0.01em]">
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
    </article>
  )
}
