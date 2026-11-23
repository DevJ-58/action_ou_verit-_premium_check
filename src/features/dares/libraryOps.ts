import type { Dare } from '@/engine'
import { newId } from '@/lib/id'

const fold = (text: string) => text.trim().toLocaleLowerCase('fr')

/** True when the library already holds a dare with the same text. */
export function hasDare(library: readonly Dare[], dare: Dare): boolean {
  return library.some((d) => fold(d.text) === fold(dare.text))
}

/** A copy of a dare that belongs to the player. */
export function ownCopy(dare: Omit<Dare, 'id'> & { id?: string }, ownerId: string): Dare {
  return { ...dare, id: dare.id ?? newId('custom'), authorId: ownerId }
}

/** Adds or replaces a dare (by id). */
export function upsertDare(library: readonly Dare[], dare: Dare): Dare[] {
  return library.some((d) => d.id === dare.id)
    ? library.map((d) => (d.id === dare.id ? dare : d))
    : [...library, dare]
}
