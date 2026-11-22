import { useId } from 'react'
import { cn } from '@/lib/cn'

export interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange(value: T): void
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  const name = useId()
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2 text-xs font-extrabold tracking-[0.18em] text-muted uppercase">
        {label}
      </legend>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex gap-1.5 rounded-lg border border-line p-1"
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-md px-2 text-sm font-bold',
              'has-focus-visible:outline-2 has-focus-visible:outline-gold',
              option.value === value ? 'bg-gold text-on-gold' : 'text-text',
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
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
