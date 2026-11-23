import { levelOf, SPEAKING_LEVEL } from './speaking'

test('silence has no level; a voice is above the speaking threshold', () => {
  expect(levelOf(new Uint8Array(512).fill(128))).toBe(0)
  const voice = Uint8Array.from({ length: 512 }, (_, i) => 128 + Math.round(40 * Math.sin(i / 3)))
  expect(levelOf(voice)).toBeGreaterThan(SPEAKING_LEVEL)
  const hiss = Uint8Array.from({ length: 512 }, (_, i) => 128 + (i % 2 ? 1 : -1))
  expect(levelOf(hiss)).toBeLessThan(SPEAKING_LEVEL)
})
