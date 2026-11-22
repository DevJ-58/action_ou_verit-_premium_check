import { drawDare, isAllowedFor, validateWrittenDare, type DrawFilter } from './dares'
import { createSeededRng } from './rng'
import type { Dare } from './types'

const dare = (over: Partial<Dare> & Pick<Dare, 'id'>): Dare => ({
  kind: 'dare',
  category: 'fun',
  intensity: 1,
  modes: ['nearby', 'remote'],
  text: 'Fais quelque chose',
  ...over,
})

const pool: Dare[] = [
  dare({ id: 'fun-d1' }),
  dare({ id: 'fun-t1', kind: 'truth' }),
  dare({ id: 'fun-d2', modes: ['nearby'] }),
  dare({ id: 'spicy-d1', category: 'spicy', intensity: 3 }),
  dare({ id: 'intimate-d1', category: 'intimate', intensity: 4 }),
]

const base: DrawFilter = {
  kind: 'dare',
  mode: 'nearby',
  categories: ['fun', 'spicy', 'intimate'],
  limits: { excludedCategories: [], maxIntensity: 4 },
  usedIds: new Set(),
}

const ids = (f: DrawFilter) =>
  pool
    .filter((d) => isAllowedFor(d, f))
    .map((d) => d.id)
    .sort()

test('excludes the other kind', () => {
  expect(ids({ ...base, kind: 'truth' })).toEqual(['fun-t1'])
})

test('excludes dares not playable in the mode', () => {
  expect(ids({ ...base, mode: 'remote' })).not.toContain('fun-d2')
})

test('excludes a category the player excluded, even if chosen for the game', () => {
  expect(
    ids({ ...base, limits: { excludedCategories: ['spicy'], maxIntensity: 4 } }),
  ).not.toContain('spicy-d1')
})

test('excludes categories not chosen for the game', () => {
  expect(ids({ ...base, categories: ['fun'] })).toEqual(['fun-d1', 'fun-d2'])
})

test('excludes intensities above the player limit', () => {
  expect(ids({ ...base, limits: { excludedCategories: [], maxIntensity: 3 } })).not.toContain(
    'intimate-d1',
  )
})

test('keeps every allowed dare', () => {
  expect(ids(base)).toEqual(['fun-d1', 'fun-d2', 'intimate-d1', 'spicy-d1'])
})

test('avoids used dares while others remain', () => {
  const used = new Set(['fun-d1', 'fun-d2', 'spicy-d1'])
  expect(drawDare(pool, { ...base, usedIds: used }, createSeededRng(1))?.id).toBe('intimate-d1')
})

test('reuses a played dare when every allowed one was used', () => {
  const used = new Set(['fun-d1', 'fun-d2', 'spicy-d1', 'intimate-d1'])
  const drawn = drawDare(pool, { ...base, usedIds: used }, createSeededRng(1))
  expect(drawn).not.toBeNull()
  expect(used.has(drawn!.id)).toBe(true)
})

test('returns null when nothing is allowed at all', () => {
  expect(drawDare(pool, { ...base, categories: ['night'] }, createSeededRng(1))).toBeNull()
})

test('the same seed draws the same dare', () => {
  expect(drawDare(pool, base, createSeededRng(9))?.id).toBe(
    drawDare(pool, base, createSeededRng(9))?.id,
  )
})

describe('validateWrittenDare', () => {
  test('rejects text shorter than 3 characters once trimmed', () => {
    expect(validateWrittenDare('  ok ')).toEqual({ ok: false, reason: 'tooShort' })
  })

  test('rejects text longer than 280 characters', () => {
    expect(validateWrittenDare('a'.repeat(281))).toEqual({ ok: false, reason: 'tooLong' })
  })

  test('returns the trimmed text when valid', () => {
    expect(validateWrittenDare('  Chante  ')).toEqual({ ok: true, text: 'Chante' })
  })
})
