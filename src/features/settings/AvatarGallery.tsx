import { useId } from 'react'
import { motion } from 'motion/react'
import { AVATARS } from '@/content/avatars'
import { cn } from '@/lib/cn'

export interface AvatarGalleryProps {
  label: string
  value: string
  onChange(avatarId: string): void
}

/** Grid of ready-made 3D avatars, as a radio group. */
export function AvatarGallery({ label, value, onChange }: AvatarGalleryProps) {
  const name = useId()
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-3 text-xs font-extrabold tracking-[0.18em] text-muted uppercase">
        {label}
      </legend>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2.5"
      >
        {AVATARS.map((avatar) => {
          const selected = avatar.id === value
          return (
            <motion.label
              key={avatar.id}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'relative flex aspect-square cursor-pointer items-center justify-center rounded-[22px] border-2 bg-seat transition-colors has-focus-visible:outline-2 has-focus-visible:outline-gold',
                selected ? 'border-gold' : 'border-transparent',
              )}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={selected}
                aria-label={avatar.label}
                onChange={() => onChange(avatar.id)}
              />
              <img
                src={avatar.src}
                alt=""
                loading="lazy"
                draggable={false}
                className="size-[78%] object-contain"
              />
              {selected ? (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 size-4 rounded-full border-2 border-bg bg-gold"
                />
              ) : null}
            </motion.label>
          )
        })}
      </div>
    </fieldset>
  )
}
