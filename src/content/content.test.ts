import { CATEGORIES } from './categories'
import { systemDares } from './systemDares'

const ORDER = ['fun', 'honest', 'romantic', 'closer', 'spicy', 'night', 'intimate', 'noreturn']

test('the 8 categories are listed in the agreed order, 3 of them free', () => {
  expect(CATEGORIES.map((c) => c.id)).toEqual(ORDER)
  expect(CATEGORIES.filter((c) => c.free).map((c) => c.id)).toEqual(['fun', 'honest', 'romantic'])
})

test('ids and texts are unique across the whole deck', () => {
  expect(new Set(systemDares.map((d) => d.id)).size).toBe(systemDares.length)
  const texts = systemDares.map((d) => d.text.toLocaleLowerCase('fr'))
  expect(new Set(texts).size).toBe(texts.length)
})

describe.each(CATEGORIES)('category $id', (category) => {
  const dares = systemDares.filter((d) => d.category === category.id)

  test('has at least 20 truths and 20 dares', () => {
    expect(dares.filter((d) => d.kind === 'truth').length).toBeGreaterThanOrEqual(20)
    expect(dares.filter((d) => d.kind === 'dare').length).toBeGreaterThanOrEqual(20)
  })

  test('intensities stay within the category range', () => {
    const [min, max] = category.intensity
    for (const d of dares) {
      expect(d.intensity, d.id).toBeGreaterThanOrEqual(min)
      expect(d.intensity, d.id).toBeLessThanOrEqual(max)
    }
  })

  test('every dare has modes, a sized text and a well-formed id', () => {
    for (const d of dares) {
      expect(d.modes.length, d.id).toBeGreaterThan(0)
      expect(d.text.length, d.id).toBeGreaterThanOrEqual(10)
      expect(d.text.length, d.id).toBeLessThanOrEqual(200)
      expect(d.id).toMatch(new RegExp(`^${category.id}-[td]\\d{2}$`))
      expect(d.id[category.id.length + 1]).toBe(d.kind === 'truth' ? 't' : 'd')
    }
  })

  test('has at least 5 entries playable remotely', () => {
    expect(dares.filter((d) => d.modes.includes('remote')).length).toBeGreaterThanOrEqual(5)
  })
})
