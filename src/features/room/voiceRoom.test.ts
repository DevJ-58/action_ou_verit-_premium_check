import { createSeededRng } from '@/engine'
import { applyIntent } from './applyIntent'
import { members, proposing } from './roomTestKit'
import type { Intent, RoomState } from './types'

const rng = createSeededRng(1)
const room = (hostPremium: boolean, over: Partial<RoomState> = {}): RoomState => ({
  code: 'ABCDEF',
  version: 1,
  hostId: 'a',
  status: 'playing',
  members: members.map((m) => (m.id === 'a' ? { ...m, premium: hostPremium } : m)),
  game: proposing(),
  reactions: [],
  ...over,
})
const voice = (from: string, on: boolean): Intent => ({
  id: `v-${from}-${on}`,
  from,
  type: 'voice',
  on,
})

test('players turn their mic on and off in a Premium room', () => {
  const on = applyIntent(room(true), voice('k', true), rng)!
  expect(on.voice).toEqual(['k'])
  const both = applyIntent(on, voice('i', true), rng)!
  expect(both.voice).toEqual(['k', 'i'])
  expect(applyIntent(both, voice('k', false), rng)!.voice).toEqual(['i'])
})

test('no live mic when the host is not Premium; turning it on twice changes nothing', () => {
  expect(applyIntent(room(false), voice('k', true), rng)).toBeNull()
  const on = applyIntent(room(true), voice('k', true), rng)!
  expect(applyIntent(on, voice('k', true), rng)).toBeNull()
})

test('a player who leaves is taken off the voice', () => {
  const on = applyIntent(
    room(true, { voice: ['k', 'i'] }),
    { id: 'l', from: 'k', type: 'leave' },
    rng,
  )!
  expect(on.voice).toEqual(['i'])
})
