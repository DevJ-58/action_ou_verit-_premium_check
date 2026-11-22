import { emojiSrc, type EmojiName } from '@/content/emoji'
import { cn } from '@/lib/cn'

export interface EmojiProps {
  name: EmojiName
  size?: number
  /** When given, the emoji is announced; otherwise it is decorative. */
  label?: string
  className?: string
}

/** A 3D emoji image (lazy-loaded, never stretched). */
export function Emoji({ name, size = 24, label, className }: EmojiProps) {
  return (
    <img
      src={emojiSrc(name)}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn('inline-block shrink-0 select-none', className)}
    />
  )
}
