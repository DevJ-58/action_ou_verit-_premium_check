import { useId, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { springs } from './motion'

export interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange(value: T): void
  /** Shown after the label (e.g. a Premium mark). */
  badge?: ReactNode
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  badge,
}: SegmentedProps<T>) {
  const name = useId()
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2 flex items-center gap-1.5 text-xs font-extrabold tracking-[0.18em] text-muted uppercase">
        {label}
        {badge}
      </legend>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex gap-1 rounded-full border border-line p-1"
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'relative flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full px-2 text-sm font-bold',
              'has-focus-visible:outline-2 has-focus-visible:outline-gold',
              option.value === value ? 'text-on-gold' : 'text-text',
            )}
          >
            <input
              type="radio"
              className="sr-only"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.value === value ? (
              <motion.span
                layoutId={`seg-${name}`}
                transition={springs.snappy}
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-gold"
              />
            ) : null}
            <span className="relative">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
