import type { CategoryId, Intensity } from '@/engine'
import type { EmojiName } from './emoji'

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
  /** 3D emoji shown on the category. */
  emoji: EmojiName
}

export const CATEGORIES: readonly CategoryMeta[] = [
  { id: 'fun', intensity: [1, 1], free: true, icon: 'Laugh', emoji: 'joy' },
  { id: 'honest', intensity: [1, 2], free: true, icon: 'MessageCircleWarning', emoji: 'eyes' },
  { id: 'romantic', intensity: [2, 2], free: true, icon: 'Heart', emoji: 'twoHearts' },
  { id: 'closer', intensity: [2, 2], free: false, icon: 'HandHeart', emoji: 'hug' },
  { id: 'spicy', intensity: [3, 3], free: false, icon: 'Flame', emoji: 'fire' },
  { id: 'night', intensity: [3, 3], free: false, icon: 'Moon', emoji: 'moon' },
  { id: 'intimate', intensity: [4, 4], free: false, icon: 'Sparkles', emoji: 'kiss' },
  { id: 'noreturn', intensity: [4, 4], free: false, icon: 'Infinity', emoji: 'smirk' },
]

export function categoryMeta(id: CategoryId): CategoryMeta {
  return CATEGORIES.find((c) => c.id === id)!
}
