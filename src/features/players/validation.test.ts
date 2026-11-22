import { validatePlayerName } from './validation'

test('an empty name is refused', () => {
  expect(validatePlayerName('   ', [])).toEqual({ ok: false, reason: 'empty' })
})

test('names longer than 24 characters are refused', () => {
  expect(validatePlayerName('a'.repeat(25), [])).toEqual({ ok: false, reason: 'tooLong' })
  expect(validatePlayerName('a'.repeat(24), [])).toEqual({ ok: true, name: 'a'.repeat(24) })
})

test('duplicates are detected regardless of case and accents', () => {
  expect(validatePlayerName('Élodie', ['elodie'])).toEqual({ ok: false, reason: 'duplicate' })
  expect(validatePlayerName(' INÈS ', ['Ines'])).toEqual({ ok: false, reason: 'duplicate' })
})

test('a valid name is trimmed', () => {
  expect(validatePlayerName('  Kofi ', ['Awa'])).toEqual({ ok: true, name: 'Kofi' })
})

test('emoji count as single characters', () => {
  expect(validatePlayerName('👩🏾‍🦱'.repeat(24), []).ok).toBe(true)
})
