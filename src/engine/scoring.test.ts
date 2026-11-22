import { pointsFor } from './scoring'

test('a done truth is worth 1, a done dare 2, a skip costs 1', () => {
  expect(pointsFor('truth', 'done')).toBe(1)
  expect(pointsFor('dare', 'done')).toBe(2)
  expect(pointsFor('truth', 'skipped')).toBe(-1)
  expect(pointsFor('dare', 'skipped')).toBe(-1)
})
