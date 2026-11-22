import { makePlayer } from '@/engine/testing'
import { setupWarnings } from './setupWarnings'

test('warns about a player who excluded every chosen category', () => {
  const p = makePlayer('a', { limits: { excludedCategories: ['fun', 'spicy'], maxIntensity: 4 } })
  expect(setupWarnings([p], ['fun', 'spicy'])).toEqual([
    { playerId: 'a', code: 'noAllowedCategory' },
  ])
})

test('warns when the intensity limit is below every chosen category', () => {
  const p = makePlayer('a', { limits: { excludedCategories: [], maxIntensity: 2 } })
  expect(setupWarnings([p], ['spicy', 'intimate'])).toEqual([
    { playerId: 'a', code: 'noAllowedCategory' },
  ])
})

test('says nothing when at least one chosen category fits', () => {
  const p = makePlayer('a', { limits: { excludedCategories: ['spicy'], maxIntensity: 2 } })
  expect(setupWarnings([p], ['spicy', 'honest'])).toEqual([])
})
