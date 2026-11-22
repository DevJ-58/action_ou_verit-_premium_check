import { format } from './format'

test('replaces named variables', () => {
  expect(format('Salut {name}', { name: 'Awa' })).toBe('Salut Awa')
})

test('keeps unknown placeholders intact', () => {
  expect(format('Salut {name}', {})).toBe('Salut {name}')
})

test('formats numbers', () => {
  expect(format('Tour {n} / {total}', { n: 2, total: 3 })).toBe('Tour 2 / 3')
})
