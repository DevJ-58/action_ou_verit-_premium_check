import { useId } from 'react'
import type { ThemeName } from '@/features/settings/settingsStore'
import { Crown } from 'lucide-react'
import { PREMIUM_THEMES } from '@/features/settings/settingsStore'
import { cn } from '@/lib/cn'

const SWATCHES: Record<ThemeName, { bg: string; text: string }> = {
  nuit: { bg: '#0f0e1a', text: '#f4ecdd' },
  ivoire: { bg: '#f4ecdd', text: '#1a1726' },
  terre: { bg: '#3a1e14', text: '#f7e9d7' },
  kente: { bg: '#0e2219', text: '#f6efd9' },
  indigo: { bg: '#101734', text: '#eef0fb' },
}

export interface ThemePickerProps {
  label: string
  value: ThemeName
  names: Record<ThemeName, string>
  onChange(theme: ThemeName): void
  premium?: boolean
  onLocked?(): void
}

/** Theme swatches shown as a radio group; Premium ones are locked for free players. */
export function ThemePicker({
  label,
  value,
  names,
  onChange,
  premium = false,
  onLocked,
}: ThemePickerProps) {
  const name = useId()
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-3 text-xs font-extrabold tracking-[0.18em] text-muted uppercase">
        {label}
      </legend>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-3">
        {(Object.keys(SWATCHES) as ThemeName[]).map((theme) => (
          <label
            key={theme}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-[1.5px] p-3 has-focus-visible:outline-2 has-focus-visible:outline-gold',
              theme === value ? 'border-gold' : 'border-line',
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={theme === value}
              onChange={() =>
                PREMIUM_THEMES.includes(theme) && !premium ? onLocked?.() : onChange(theme)
              }
            />
            <span
              aria-hidden="true"
              className="flex h-16 w-full items-center justify-center rounded-lg font-display text-2xl ring-1 ring-[#e3b23c]"
              style={{ background: SWATCHES[theme].bg, color: SWATCHES[theme].text }}
            >
              Aa
            </span>
            <span className="flex items-center gap-1 text-sm font-bold">
              {PREMIUM_THEMES.includes(theme) ? (
                <Crown aria-hidden="true" size={12} className="text-gold-text" />
              ) : null}
              {names[theme]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
