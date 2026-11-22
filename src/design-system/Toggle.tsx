import { cn } from '@/lib/cn'

export interface ToggleProps {
  label: string
  checked: boolean
  onChange(checked: boolean): void
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-4 text-left text-base font-semibold"
    >
      {label}
      <span
        aria-hidden="true"
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full border-[1.5px] transition-colors duration-(--dur-base)',
          checked ? 'border-gold bg-gold' : 'border-line bg-transparent',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full transition-[left] duration-(--dur-base) ease-(--ease-out-expo)',
            checked ? 'left-6 bg-on-gold' : 'left-0.5 bg-muted',
          )}
        />
      </span>
    </button>
  )
}
