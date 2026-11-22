import type { CategoryId, Intensity } from '@/engine'

export interface CategoryMeta {
  id: CategoryId
  /** Intensity range of the category's dares, inclusive. */
  intensity: readonly [Intensity, Intensity]
  /** Playable without Premium. */
  free: boolean
  /** lucide-react icon name. */
  icon:
    | 'Laugh'
    | 'MessageCircleWarning'
    | 'Heart'
    | 'HandHeart'
    | 'Flame'
    | 'Moon'
    | 'Sparkles'
    | 'Infinity'
}

export const CATEGORIES: readonly CategoryMeta[] = [
  { id: 'fun', intensity: [1, 1], free: true, icon: 'Laugh' },
  { id: 'honest', intensity: [1, 2], free: true, icon: 'MessageCircleWarning' },
  { id: 'romantic', intensity: [2, 2], free: true, icon: 'Heart' },
  { id: 'closer', intensity: [2, 2], free: false, icon: 'HandHeart' },
  { id: 'spicy', intensity: [3, 3], free: false, icon: 'Flame' },
  { id: 'night', intensity: [3, 3], free: false, icon: 'Moon' },
  { id: 'intimate', intensity: [4, 4], free: false, icon: 'Sparkles' },
  { id: 'noreturn', intensity: [4, 4], free: false, icon: 'Infinity' },
]

export function categoryMeta(id: CategoryId): CategoryMeta {
  return CATEGORIES.find((c) => c.id === id)!
}
