import { createSeededRng } from '@/engine'
import { applyIntent, roomIsPremium } from './applyIntent'
import { members } from './roomTestKit'
import type { Member, RoomState } from './types'

const rng = createSeededRng(1)
const lobby = (hostPremium: boolean, count: number): RoomState => ({
  code: 'ABCDEF',
  version: 1,
  hostId: 'h',
  status: 'lobby',
  members: [
    { ...members[0]!, id: 'h', premium: hostPremium },
    ...Array.from({ length: count - 1 }, (_, i) => ({ ...members[1]!, id: `m${i}` })),
  ],
  game: null,
  reactions: [],
})
const newcomer: Member = { ...members[2]!, id: 'new' }
const join = (room: RoomState) =>
  applyIntent(room, { id: 'j', from: 'new', type: 'join', member: newcomer }, rng)

test('a room is Premium when its host is', () => {
  expect(roomIsPremium(lobby(true, 2))).toBe(true)
  expect(roomIsPremium(lobby(false, 2))).toBe(false)
})

test('a free host’s room holds 6 players; a Premium host’s room holds 12', () => {
  expect(join(lobby(false, 5))).not.toBeNull()
  expect(join(lobby(false, 6))).toBeNull()
  expect(join(lobby(true, 6))).not.toBeNull()
  expect(join(lobby(true, 12))).toBeNull()
})

test('a free host can only start with free categories and no live video', () => {
  const start = (room: RoomState, categories: string[], liveSeconds = 60) =>
    applyIntent(
      room,
      { id: 's', from: 'h', type: 'start', setup: { categories, liveSeconds } as never },
      rng,
    )
  expect(start(lobby(false, 2), ['fun', 'spicy'])).toBeNull()
  const free = start(lobby(false, 2), ['fun'])!
  expect(free.game!.settings.liveSeconds).toBe(0)
  const premium = start(lobby(true, 2), ['fun', 'spicy'])!
  expect(premium.game!.settings).toMatchObject({ categories: ['fun', 'spicy'], liveSeconds: 60 })
})
