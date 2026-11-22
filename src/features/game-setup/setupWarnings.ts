import { categoryMeta } from '@/content/categories'
import type { CategoryId, Player } from '@/engine'

export interface SetupWarning {
  playerId: string
  code: 'noAllowedCategory'
}

/** Players for whom no chosen category fits their limits (they would only get written dares). */
export function setupWarnings(
  players: readonly Player[],
  categories: readonly CategoryId[],
): SetupWarning[] {
  return players
    .filter(
      (player) =>
        !categories.some(
          (id) =>
            !player.limits.excludedCategories.includes(id) &&
            categoryMeta(id).intensity[0] <= player.limits.maxIntensity,
        ),
    )
    .map((player) => ({ playerId: player.id, code: 'noAllowedCategory' as const }))
}
