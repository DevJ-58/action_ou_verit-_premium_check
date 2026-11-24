import { AXIS_ID } from '@/content/axis'
import { createSeededRng } from '@/engine'
import { applyIntent } from './applyIntent'
import { createInMemoryBus } from './bus'
import { createLocalTransport } from './localTransport'
import { createRoomStore, type RoomStore } from './roomStore'
import type { Intent, Member, RoomState } from './types'

const rng = createSeededRng(1)
const member = (id: string): Member => ({
  id,
  pseudo: id.toUpperCase(),
  avatarId: '1f981',
  limits: { excludedCategories: [], maxIntensity: 4 },
  customDares: [],
})
const lobby = (over: Partial<RoomState> = {}): RoomState => ({
  code: 'ABCDEF',
  version: 1,
  hostId: 'a',
  status: 'lobby',
  members: [member('a'), member('b')],
  game: null,
  reactions: [],
  ...over,
})
const bot = (from: string, on: boolean): Intent => ({
  id: `b-${from}-${on}`,
  from,
  type: 'bot',
  on,
})
const flush = async () => {
  for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0))
}

test('the host adds Axis once in the lobby, and can take him out', () => {
  const withAxis = applyIntent(lobby(), bot('a', true), rng)!
  expect(withAxis.members.map((m) => m.id)).toEqual(['a', 'b', AXIS_ID])
  expect(applyIntent(withAxis, bot('a', true), rng)).toBeNull()
  expect(applyIntent(withAxis, bot('a', false), rng)!.members.map((m) => m.id)).toEqual(['a', 'b'])
})

test('nobody else adds Axis, nor once the game started, nor in a full room', () => {
  expect(applyIntent(lobby(), bot('b', true), rng)).toBeNull()
  expect(applyIntent(lobby({ status: 'playing' }), bot('a', true), rng)).toBeNull()
  const full = lobby({ members: ['a', 'b', 'c', 'd', 'e', 'f'].map(member) })
  expect(applyIntent(full, bot('a', true), rng)).toBeNull()
})

async function hostWithAxis(): Promise<{ host: RoomStore; guest: RoomStore }> {
  const bus = createInMemoryBus()
  const phone = (id: string) =>
    createRoomStore({
      transport: createLocalTransport(bus),
      self: member(id),
      rng: createSeededRng(2),
    })
  const host = phone('a')
  const code = await host.getState().createRoom()
  const guest = phone('b')
  await guest.getState().joinRoom(code)
  host.getState().setBot(true)
  await flush()
  return { host, guest }
}

test('the host plays for Axis; a guest cannot, and nobody plays for a human', async () => {
  const { host, guest } = await hostWithAxis()
  host.getState().start({ categories: ['fun'] })
  await flush()
  guest.getState().actAs(AXIS_ID, { type: 'action', action: { type: 'SPIN' } })
  await flush()
  expect(host.getState().room!.game!.phase).toBe('ready')
  host.getState().actAs('b', { type: 'action', action: { type: 'SPIN' } })
  expect(host.getState().room!.game!.phase).toBe('ready')
  host.getState().actAs(AXIS_ID, { type: 'action', action: { type: 'SPIN' } })
  expect(host.getState().room!.game!.phase).toBe('spinning')
})

test('Axis is always online, and what he says reaches every phone', async () => {
  const { host, guest } = await hostWithAxis()
  expect(host.getState().online.has(AXIS_ID)).toBe(true)
  expect(guest.getState().online.has(AXIS_ID)).toBe(true)
  for (let i = 0; i < 25; i++) host.getState().say(AXIS_ID, `Bonjour ${i}`, 'happy')
  await flush()
  const chat = guest.getState().room!.botChat!
  expect(chat).toHaveLength(20)
  expect(chat.at(-1)).toMatchObject({ from: AXIS_ID, text: 'Bonjour 24', mood: 'happy' })
})

test('Axis never becomes host: when the host leaves him alone, the room is over', async () => {
  const bus = createInMemoryBus()
  const host = createRoomStore({
    transport: createLocalTransport(bus),
    self: member('a'),
    rng: createSeededRng(3),
  })
  await host.getState().createRoom()
  host.getState().setBot(true)
  expect(host.getState().room!.members).toHaveLength(2)
  host.getState().leave()
  expect(host.getState().room).toBeNull()
})
