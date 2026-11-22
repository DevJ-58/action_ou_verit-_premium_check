import { CATEGORIES } from '@/content/categories'
import type { CategoryId } from '@/engine'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'

export interface CategoryGridProps {
  selected: CategoryId[]
  onChange(selected: CategoryId[]): void
}

export function CategoryGrid({ selected, onChange }: CategoryGridProps) {
  const t = useT()
  return (
    <div className="grid grid-cols-2 gap-3">
      {CATEGORIES.map((c) => {
        const on = selected.includes(c.id)
        const max = c.intensity[1]
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(on ? selected.filter((id) => id !== c.id) : [...selected, c.id])
            }
            className={cn(
              'flex min-h-28 flex-col justify-between rounded-xl border-[1.5px] p-3.5 text-left transition-colors',
              on ? 'border-gold bg-gold text-on-gold' : 'border-line text-text',
            )}
          >
            <span className="text-base leading-tight font-extrabold">
              {t.categories[c.id].name}
            </span>
            <span className={cn('text-xs leading-snug', on ? 'text-on-gold' : 'text-muted')}>
              {t.categories[c.id].description}
            </span>
            <span aria-hidden="true" className="flex gap-1.5 pt-1">
              {[1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className={cn(
                    'size-2 rotate-45',
                    level <= max
                      ? on
                        ? 'bg-on-gold'
                        : 'bg-gold'
                      : 'border border-current opacity-40',
                  )}
                />
              ))}
            </span>
          </button>
        )
      })}
    </div>
  )
}
