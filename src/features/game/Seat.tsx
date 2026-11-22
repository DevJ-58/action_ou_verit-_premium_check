import { Avatar, type AvatarRole } from '@/design-system'
import { cn } from '@/lib/cn'

export interface SeatProps {
  name: string
  avatarId?: string
  angle: number
  role: AvatarRole
  lit: boolean
}

/** A player's place around the table, positioned by its angle. */
export function Seat({ name, avatarId, angle, role, lit }: SeatProps) {
  const rad = (angle * Math.PI) / 180
  const highlighted = role !== 'none' || lit
  return (
    <div
      className="absolute flex w-20 -translate-x-1/2 -translate-y-7 flex-col items-center gap-1.5"
      style={{ left: `${50 + 44 * Math.sin(rad)}%`, top: `${50 - 44 * Math.cos(rad)}%` }}
    >
      <span
        className={cn(
          'transition-transform duration-(--dur-base)',
          (role === 'answerer' || lit) && 'scale-115',
        )}
      >
        <Avatar
          name={name}
          avatarId={avatarId}
          highlight={lit && role === 'none' ? 'answerer' : role}
        />
      </span>
      <span
        className={cn(
          'max-w-20 truncate text-[13px]',
          highlighted ? 'font-extrabold' : 'font-semibold text-muted',
        )}
      >
        {name}
      </span>
    </div>
  )
}
