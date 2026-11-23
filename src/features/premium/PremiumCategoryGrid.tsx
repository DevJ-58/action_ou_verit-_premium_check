import { useState } from 'react'
import type { CategoryId } from '@/engine'
import { CategoryGrid } from '@/features/game-setup/CategoryGrid'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { premiumCategories } from './premium'
import { PremiumSheet } from './PremiumSheet'

export interface PremiumCategoryGridProps {
  premium: boolean
  selected: CategoryId[]
  onChange(selected: CategoryId[]): void
}

/** The category grid, with Premium categories locked for free players. */
export function PremiumCategoryGrid({ premium, selected, onChange }: PremiumCategoryGridProps) {
  const t = useT()
  const [locked, setLocked] = useState<CategoryId | null>(null)
  return (
    <>
      <CategoryGrid
        selected={selected}
        onChange={onChange}
        locked={premium ? [] : premiumCategories()}
        onLocked={setLocked}
      />
      <PremiumSheet
        open={locked !== null}
        onClose={() => setLocked(null)}
        reason={locked ? format(t.premium.lockedCategory, { name: t.categories[locked].name }) : ''}
      />
    </>
  )
}
