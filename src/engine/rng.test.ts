import { createSeededRng, pickIndex } from './rng'

test('the same seed gives the same sequence', () => {
  const a = createSeededRng(42)
  const b = createSeededRng(42)
  const seqA = Array.from({ length: 5 }, () => a())
  const seqB = Array.from({ length: 5 }, () => b())
  expect(seqA).toEqual(seqB)
  for (const x of seqA) {
    expect(x).toBeGreaterThanOrEqual(0)
    expect(x).toBeLessThan(1)
  }
})

test('different seeds give different sequences', () => {
  expect(createSeededRng(1)()).not.toBe(createSeededRng(2)())
})

test('pickIndex stays within bounds', () => {
  expect(pickIndex(5, () => 0.999)).toBe(4)
  expect(pickIndex(5, () => 0)).toBe(0)
})
