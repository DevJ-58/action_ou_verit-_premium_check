import type { CategoryId, ChallengeKind, Dare, Intensity, PlayMode } from '@/engine'
import { CATEGORIES } from './categories'
import closer from './dares/closer.json'
import fun from './dares/fun.json'
import honest from './dares/honest.json'
import intimate from './dares/intimate.json'
import night from './dares/night.json'
import noreturn from './dares/noreturn.json'
import romantic from './dares/romantic.json'
import spicy from './dares/spicy.json'

/**
 * Deck files list texts per kind. A plain string is playable nearby and remotely
 * at the category's minimum intensity; an object overrides `modes` / `intensity`.
 */
type Entry = string | { text: string; modes?: string[]; intensity?: number }
interface DeckFile {
  truths: Entry[]
  dares: Entry[]
}

const decks: Record<CategoryId, DeckFile> = {
  fun,
  honest,
  romantic,
  closer,
  spicy,
  night,
  intimate,
  noreturn,
}

function expand(category: CategoryId, kind: ChallengeKind, entries: Entry[]): Dare[] {
  const minIntensity = CATEGORIES.find((c) => c.id === category)!.intensity[0]
  return entries.map((entry, index) => {
    const item = typeof entry === 'string' ? { text: entry } : entry
    return {
      id: `${category}-${kind === 'truth' ? 't' : 'd'}${String(index + 1).padStart(2, '0')}`,
      kind,
      category,
      intensity: (item.intensity ?? minIntensity) as Intensity,
      modes: (item.modes ?? ['nearby', 'remote']) as PlayMode[],
      text: item.text,
    }
  })
}

/** Every built-in truth and dare, in French. */
export const systemDares: readonly Dare[] = CATEGORIES.flatMap(({ id }) => [
  ...expand(id, 'truth', decks[id].truths),
  ...expand(id, 'dare', decks[id].dares),
])
