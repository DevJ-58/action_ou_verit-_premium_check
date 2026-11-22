import { ArrowDown, ArrowUp, Check } from 'lucide-react'
import { Avatar, IconButton } from '@/design-system'
import type { Player } from '@/engine'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'

export interface SeatOrderProps {
  players: Player[]
  /** Ids of the players at the table, in seating order. */
  seated: string[]
  onChange(seated: string[]): void
}

function move(list: string[], index: number, delta: number): string[] {
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(index + delta, 0, item!)
  return next
}

/** Who plays, and in which order around the phone (keyboard-friendly reordering). */
export function SeatOrder({ players, seated, onChange }: SeatOrderProps) {
  const t = useT()
  const byId = new Map(players.map((p) => [p.id, p]))
  const absent = players.filter((p) => !seated.includes(p.id))
  const rows = [...seated.map((id) => byId.get(id)!).filter(Boolean), ...absent]

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((player) => {
        const index = seated.indexOf(player.id)
        const isSeated = index !== -1
        return (
          <li key={player.id} className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={isSeated}
              onClick={() =>
                onChange(
                  isSeated ? seated.filter((id) => id !== player.id) : [...seated, player.id],
                )
              }
              className={cn(
                'flex min-h-14 flex-1 items-center gap-3 rounded-xl border-[1.5px] px-3 text-left',
                isSeated ? 'border-gold' : 'border-line opacity-60',
              )}
            >
              <span className="w-5 text-center text-sm font-extrabold text-gold-text tabular-nums">
                {isSeated ? index + 1 : ''}
              </span>
              <Avatar name={player.name} size="sm" />
              <span className="flex-1 font-bold">{player.name}</span>
              {isSeated ? <Check aria-hidden="true" size={18} className="text-gold-text" /> : null}
            </button>
            {isSeated ? (
              <>
                <IconButton
                  label={format(t.setup.moveUp, { name: player.name })}
                  icon={<ArrowUp size={18} />}
                  disabled={index === 0}
                  onClick={() => onChange(move(seated, index, -1))}
                  className="disabled:opacity-30"
                />
                <IconButton
                  label={format(t.setup.moveDown, { name: player.name })}
                  icon={<ArrowDown size={18} />}
                  disabled={index === seated.length - 1}
                  onClick={() => onChange(move(seated, index, 1))}
                  className="disabled:opacity-30"
                />
              </>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
