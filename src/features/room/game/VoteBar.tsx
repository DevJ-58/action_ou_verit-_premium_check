import { Emoji } from '@/design-system'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'

export interface VoteBarProps {
  votes: Record<string, boolean>
  /** This phone's current vote; undefined when it may not vote. */
  mine?: boolean | null
  onVote?(ok: boolean): void
}

/** The verdicts of the other players, and this player's vote buttons. */
export function VoteBar({ votes, mine, onVote }: VoteBarProps) {
  const t = useT()
  const values = Object.values(votes)
  const ok = values.filter(Boolean).length
  const tally = format(t.roomGame.tally, { ok, no: values.length - ok })
  const choice = (value: boolean, label: string, emoji: 'clap' | 'thinking') => (
    <button
      type="button"
      aria-pressed={mine === value}
      onClick={() => onVote?.(value)}
      className={cn(
        'flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-full border-[1.5px] px-3 text-sm font-bold whitespace-nowrap transition-colors',
        mine === value ? 'border-gold bg-gold text-on-gold' : 'border-line text-text',
      )}
    >
      <Emoji name={emoji} size={22} />
      {label}
    </button>
  )
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-2">
      {onVote ? (
        <div role="group" aria-label={t.roomGame.voteLabel} className="flex w-full gap-2">
          {choice(true, t.roomGame.voteOk, 'clap')}
          {choice(false, t.roomGame.voteNo, 'thinking')}
        </div>
      ) : null}
      {values.length > 0 ? <p className="text-sm font-semibold text-muted">{tally}</p> : null}
    </div>
  )
}
