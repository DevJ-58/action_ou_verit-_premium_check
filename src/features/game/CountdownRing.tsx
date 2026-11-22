import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { useCountdown } from './useCountdown'

export interface CountdownRingProps {
  seconds: number
}

/** Diamond-shaped countdown (give it a `key` per turn to restart); announces when time is up but never ends the turn itself. */
export function CountdownRing({ seconds }: CountdownRingProps) {
  const t = useT()
  const left = useCountdown(seconds)
  return (
    <div className="flex items-center gap-3">
      {left === 0 ? (
        <span role="status" className="text-sm font-extrabold text-dare">
          {t.game.timeUp}
        </span>
      ) : null}
      <div
        role="timer"
        aria-label={format(t.game.timeLeft, { seconds: left })}
        className="relative flex size-14 items-center justify-center"
      >
        <span
          aria-hidden="true"
          className="absolute size-10 rotate-45 border-[1.5px] border-gold"
        />
        <span
          aria-hidden="true"
          className="absolute size-12 rotate-45 border border-dashed border-line"
        />
        <span className="relative text-[17px] font-extrabold tabular-nums">{left}</span>
      </div>
    </div>
  )
}
