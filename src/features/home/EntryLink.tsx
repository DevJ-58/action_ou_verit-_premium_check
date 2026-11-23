import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { Emoji } from '@/design-system'
import type { EmojiName } from '@/content/emoji'
import { cn } from '@/lib/cn'

export interface EntryLinkProps {
  to: string
  emoji: EmojiName
  title: string
  hint: string
  primary?: boolean
  /** Stacked tile, for two side by side. */
  compact?: boolean
}

const MotionLink = motion.create(Link)

/** A big, friendly entry point on the home screen. */
export function EntryLink({
  to,
  emoji,
  title,
  hint,
  primary = false,
  compact = false,
}: EntryLinkProps) {
  return (
    <MotionLink
      to={to}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      className={cn(
        'flex rounded-[28px]',
        compact ? 'flex-col gap-2.5 p-4' : 'min-h-22 items-center gap-4 px-5 py-4',
        primary ? 'bg-gold text-on-gold shadow-card' : 'border-[1.5px] border-line text-text',
      )}
    >
      <span
        className={cn(
          'flex size-13 shrink-0 items-center justify-center rounded-[20px]',
          primary ? 'bg-on-gold/10' : 'bg-seat',
        )}
      >
        <Emoji name={emoji} size={34} />
      </span>
      <span className="flex flex-1 flex-col">
        <span className={cn('font-extrabold', compact ? 'text-base leading-tight' : 'text-lg')}>
          {title}
        </span>
        <span className={cn('text-sm', primary ? 'text-on-gold/80' : 'text-muted')}>{hint}</span>
      </span>
      {compact ? null : <ChevronRight aria-hidden="true" size={22} />}
    </MotionLink>
  )
}
