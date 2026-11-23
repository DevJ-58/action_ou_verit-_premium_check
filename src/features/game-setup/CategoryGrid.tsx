import { CATEGORIES } from '@/content/categories'
import { Emoji } from '@/design-system'
import type { CategoryId } from '@/engine'
import { useT } from '@/i18n/useT'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface CategoryGridProps {
  selected: CategoryId[]
  onChange(selected: CategoryId[]): void
  /** Premium categories this player cannot use; tapping one calls onLocked. */
  locked?: readonly CategoryId[]
  onLocked?(id: CategoryId): void
}

export function CategoryGrid({ selected, onChange, locked = [], onLocked }: CategoryGridProps) {
  const t = useT()
  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-3 @[44rem]:grid-cols-4">
        {CATEGORIES.map((c) => {
          const isLocked = locked.includes(c.id)
          const on = !isLocked && selected.includes(c.id)
          const max = c.intensity[1]
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              aria-describedby={isLocked ? `${c.id}-locked` : undefined}
              onClick={() =>
                isLocked
                  ? onLocked?.(c.id)
                  : onChange(on ? selected.filter((id) => id !== c.id) : [...selected, c.id])
              }
              className={cn(
                'flex min-h-32 flex-col justify-between gap-2 rounded-[24px] border-[1.5px] p-4 text-left transition-colors active:scale-[0.98]',
                on ? 'border-gold bg-gold text-on-gold' : 'border-line text-text',
              )}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-base leading-tight font-extrabold">
                  {t.categories[c.id].name}
                </span>
                <Emoji
                  name={c.emoji}
                  size={30}
                  className={on ? 'scale-110 transition-transform' : 'transition-transform'}
                />
              </span>
              <span className={cn('text-xs leading-snug', on ? 'text-on-gold' : 'text-muted')}>
                {t.categories[c.id].description}
              </span>
              {isLocked ? (
                <span
                  id={`${c.id}-locked`}
                  className="flex items-center gap-1 self-start rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold tracking-[0.12em] text-on-gold uppercase"
                >
                  <Lock aria-hidden="true" size={10} />
                  {t.premium.locked}
                </span>
              ) : null}
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
    </div>
  )
}
