import { Emoji } from '@/design-system'
import { categoryMeta } from '@/content/categories'
import type { CategoryId } from '@/engine'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'

export interface CategoryChipsProps {
  label: string
  categories: readonly CategoryId[]
  value: CategoryId
  onChange(category: CategoryId): void
}

/** A scrollable row of category chips; one is selected. */
export function CategoryChips({ label, categories, value, onChange }: CategoryChipsProps) {
  const t = useT()
  return (
    <div role="group" aria-label={label} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {categories.map((id) => (
        <button
          key={id}
          type="button"
          aria-pressed={id === value}
          onClick={() => onChange(id)}
          className={cn(
            'flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-sm font-bold whitespace-nowrap',
            id === value ? 'border-gold bg-gold text-on-gold' : 'border-line text-text',
          )}
        >
          <Emoji name={categoryMeta(id).emoji} size={20} />
          {t.categories[id].name}
        </button>
      ))}
    </div>
  )
}
