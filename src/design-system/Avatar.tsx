import { AXIS_AVATAR } from '@/content/axis'
import { avatarById } from '@/content/avatars'
import { AxisFace } from './AxisFace'
import { cn } from '@/lib/cn'

export type AvatarRole = 'none' | 'answerer' | 'asker'

export interface AvatarProps {
  name: string
  /** A 3D avatar from the gallery; falls back to the name's initial. */
  avatarId?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Highlight for the player designated by the bottle (answerer) or asking. */
  highlight?: AvatarRole
}

const sizes = {
  sm: 'size-10 text-lg',
  md: 'size-12.5 text-[22px]',
  lg: 'size-16 text-3xl',
  xl: 'size-28 text-5xl',
}

const roles: Record<AvatarRole, string> = {
  none: 'ring-[1.5px] ring-gold',
  answerer: 'shadow-[0_0_0_3px_var(--bg),0_0_0_5px_var(--gold)]',
  asker: 'shadow-[0_0_0_3px_var(--bg),0_0_0_4.5px_var(--text)]',
}

const fills: Record<AvatarRole, string> = {
  none: 'bg-seat text-text',
  answerer: 'bg-dare text-ink',
  asker: 'bg-truth text-ivory',
}

/** Player medallion: a 3D avatar, or the initial of the name in the display serif. */
export function Avatar({ name, avatarId, size = 'md', highlight = 'none' }: AvatarProps) {
  const avatar = avatarById(avatarId)
  const base = cn(
    'inline-flex shrink-0 items-center justify-center rounded-full',
    sizes[size],
    roles[highlight],
    fills[highlight],
  )
  if (avatarId === AXIS_AVATAR) {
    return (
      <span className={cn(base, 'overflow-hidden')}>
        <AxisFace name={name} />
      </span>
    )
  }
  if (avatar) {
    return (
      <span className={cn(base, 'overflow-hidden')}>
        <img src={avatar.src} alt={name} draggable={false} className="size-[88%] object-contain" />
      </span>
    )
  }
  const segmenter = new Intl.Segmenter('fr', { granularity: 'grapheme' })
  const first = [...segmenter.segment(name.trim())][0]?.segment ?? '?'
  return (
    <span role="img" aria-label={name} className={cn(base, 'font-display')}>
      {first.toLocaleUpperCase('fr')}
    </span>
  )
}
