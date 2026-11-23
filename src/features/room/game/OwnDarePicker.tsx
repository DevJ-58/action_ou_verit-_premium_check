import { Send } from 'lucide-react'
import type { Dare } from '@/engine'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'

export interface OwnDarePickerProps {
  dares: Dare[]
  sentText?: string
  onPick(dare: Dare): void
}

/** The player's prepared dares that fit this turn; one tap proposes one. */
export function OwnDarePicker({ dares, sentText, onPick }: OwnDarePickerProps) {
  const t = useT()
  if (dares.length === 0) return <p className="py-6 text-center text-muted">{t.roomGame.noOwn}</p>
  return (
    <ul className="flex max-h-[50dvh] flex-col gap-2 overflow-y-auto">
      {dares.map((dare) => {
        const sent = dare.text === sentText
        return (
          <li key={dare.id}>
            <button
              type="button"
              aria-label={`${t.myDares.choose} : ${dare.text}`}
              aria-pressed={sent}
              onClick={() => onPick(dare)}
              className={cn(
                'flex min-h-14 w-full items-center gap-3 rounded-[18px] border-[1.5px] p-3 text-left',
                sent ? 'border-gold' : 'border-line',
              )}
            >
              <span className="flex-1 text-[15px] leading-snug font-semibold">{dare.text}</span>
              <Send aria-hidden="true" size={18} className="shrink-0 text-gold-text" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
