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
}

const MotionLink = motion.create(Link)

/** A big, friendly entry point on the home screen. */
export function EntryLink({ to, emoji, title, hint, primary = false }: EntryLinkProps) {
  return (
    <MotionLink
      to={to}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'flex min-h-20 items-center gap-4 rounded-[28px] px-5 py-4',
        primary ? 'bg-gold text-on-gold' : 'border-[1.5px] border-line text-text',
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
        <span className="text-[17px] font-extrabold">{title}</span>
        <span className={cn('text-sm', primary ? 'text-on-gold/80' : 'text-muted')}>{hint}</span>
      </span>
      <ChevronRight aria-hidden="true" size={22} />
    </MotionLink>
  )
}
