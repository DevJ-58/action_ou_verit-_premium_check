import { cn } from '@/lib/cn'

export type AvatarRole = 'none' | 'answerer' | 'asker'

export interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  role?: AvatarRole
}

const sizes = { sm: 'size-10 text-lg', md: 'size-12.5 text-[22px]', lg: 'size-16 text-3xl' }

const roles: Record<AvatarRole, string> = {
  none: 'bg-seat text-text ring-[1.5px] ring-gold',
  answerer: 'bg-dare text-ink shadow-[0_0_0_3px_var(--bg),0_0_0_5px_var(--gold)]',
  asker: 'bg-truth text-ivory shadow-[0_0_0_3px_var(--bg),0_0_0_4.5px_var(--text)]',
}

/** Player medallion: the initial of the name in the display serif. */
export function Avatar({ name, size = 'md', role = 'none' }: AvatarProps) {
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase('fr') ?? '?'
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-display',
        sizes[size],
        roles[role],
      )}
    >
      {initial}
    </span>
  )
}
