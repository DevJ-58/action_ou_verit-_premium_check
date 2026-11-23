import { AVATARS, avatarById } from './avatars'

test('offers 36 free and 12 Premium avatars with unique ids and resolved images', () => {
  expect(AVATARS.filter((a) => !a.premium)).toHaveLength(36)
  expect(AVATARS.filter((a) => a.premium)).toHaveLength(12)
  expect(new Set(AVATARS.map((a) => a.id)).size).toBe(48)
  for (const avatar of AVATARS) {
    expect(avatar.src, avatar.id).toMatch(/\.webp|^data:image/)
    expect(avatar.label.length, avatar.id).toBeGreaterThan(0)
  }
})

test('looks avatars up by id', () => {
  const first = AVATARS[0]!
  expect(avatarById(first.id)).toBe(first)
  expect(avatarById('nope')).toBeUndefined()
})
