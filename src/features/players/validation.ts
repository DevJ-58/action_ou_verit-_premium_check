export const PLAYER_NAME_MAX = 24

export type PlayerNameResult =
  { ok: true; name: string } | { ok: false; reason: 'empty' | 'tooLong' | 'duplicate' }

function fold(name: string): string {
  return name.trim().normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr')
}

function graphemeCount(text: string): number {
  return [...new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(text)].length
}

/** Trims a nickname and checks its length and uniqueness on this phone. */
export function validatePlayerName(name: string, existing: readonly string[]): PlayerNameResult {
  const trimmed = name.trim()
  if (trimmed.length === 0) return { ok: false, reason: 'empty' }
  if (graphemeCount(trimmed) > PLAYER_NAME_MAX) return { ok: false, reason: 'tooLong' }
  if (existing.some((other) => fold(other) === fold(trimmed)))
    return { ok: false, reason: 'duplicate' }
  return { ok: true, name: trimmed }
}
