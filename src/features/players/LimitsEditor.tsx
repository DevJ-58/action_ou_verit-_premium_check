import { Segmented } from '@/design-system'
import { CATEGORIES } from '@/content/categories'
import type { CategoryId, Intensity, PlayerLimits } from '@/engine'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'

export interface LimitsEditorProps {
  limits: PlayerLimits
  onChange(limits: PlayerLimits): void
}

const INTENSITIES = ['1', '2', '3', '4'] as const

export function LimitsEditor({ limits, onChange }: LimitsEditorProps) {
  const t = useT()
  const toggle = (id: CategoryId) =>
    onChange({
      ...limits,
      excludedCategories: limits.excludedCategories.includes(id)
        ? limits.excludedCategories.filter((c) => c !== id)
        : [...limits.excludedCategories, id],
    })

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-extrabold">{t.players.limits}</h2>
        <p className="text-sm text-muted">{t.players.limitsHint}</p>
      </div>
      <Segmented
        label={t.players.maxIntensity}
        value={String(limits.maxIntensity) as (typeof INTENSITIES)[number]}
        options={INTENSITIES.map((i) => ({ value: i, label: i }))}
        onChange={(v) => onChange({ ...limits, maxIntensity: Number(v) as Intensity })}
      />
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 text-xs font-extrabold tracking-[0.18em] text-muted uppercase">
          {t.players.excluded}
        </legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const excluded = limits.excludedCategories.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={excluded}
                onClick={() => toggle(c.id)}
                className={cn(
                  'min-h-11 rounded-full border-[1.5px] px-4 text-sm font-semibold',
                  excluded ? 'border-dare bg-dare text-ink line-through' : 'border-line text-text',
                )}
              >
                {t.categories[c.id].name}
              </button>
            )
          })}
        </div>
      </fieldset>
    </section>
  )
}
