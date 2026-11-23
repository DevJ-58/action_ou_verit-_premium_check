import { createSeededRng } from '@/engine'
import { createInMemoryBus } from './bus'
import { createLocalTransport } from './localTransport'
import { generateRoomCode, isRoomCode } from './roomCode'
import { createRoomStore, type RoomStore } from './roomStore'
import type { Member } from './types'

const member = (id: string): Member => ({
  id,
  pseudo: id.toUpperCase(),
  avatarId: '1f981',
  limits: { excludedCategories: [], maxIntensity: 4 },
  customDares: [],
})

/** Lets the asynchronous bus deliver every chained message (intent → host → state). */
const flush = async () => {
  for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0))
}

function phone(bus: ReturnType<typeof createInMemoryBus>, id: string, seed = 1): RoomStore {
  return createRoomStore({
    transport: createLocalTransport(bus),
    self: member(id),
    rng: createSeededRng(seed),
  })
}

async function lobbyWith(...ids: string[]) {
  const bus = createInMemoryBus()
  const [hostId, ...guestIds] = ids
  const host = phone(bus, hostId!)
  const code = await host.getState().createRoom()
  const guests = []
  for (const id of guestIds) {
    const g = phone(bus, id)
    await g.getState().joinRoom(code)
    guests.push(g)
  }
  await flush()
  return { bus, host, guests, code }
}

test('room codes are 6 unambiguous characters', () => {
  const code = generateRoomCode(createSeededRng(3))
  expect(isRoomCode(code)).toBe(true)
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
  expect(isRoomCode('ABC1O0')).toBe(false)
})

test('guests who join appear on every phone', async () => {
  const { host, guests } = await lobbyWith('a', 'b', 'c')
  for (const p of [host, ...guests]) {
    expect(p.getState().room!.members.map((m) => m.id)).toEqual(['a', 'b', 'c'])
  }
  expect(host.getState().role).toBe('host')
  expect(guests[0]!.getState().role).toBe('guest')
})

test('only the host starts; then every phone shows the same game, step after step', async () => {
  const { host, guests } = await lobbyWith('a', 'b')
  const [b] = guests
  await b!.getState().start({ categories: ['fun'] })
  await flush()
  expect(host.getState().room!.game).toBeNull()

  await host.getState().start({ categories: ['fun'] })
  await flush()
  expect(b!.getState().room!.game!.phase).toBe('ready')
  expect(b!.getState().room!.game!.settings.flow).toBe('everyone')

  b!.getState().act({ type: 'SPIN' })
  await flush()
  expect(host.getState().room!.game!.phase).toBe('spinning')
  expect(b!.getState().room!.game).toEqual(host.getState().room!.game)
})

test('the host only accepts actions from the right player', async () => {
  const { host, guests } = await lobbyWith('a', 'b', 'c')
  await host.getState().start({ categories: ['fun'] })
  host.getState().act({ type: 'SPIN' })
  host.getState().act({ type: 'SPIN_SETTLED' })
  await flush()
  const answerer = host.getState().room!.game!.turn!.answererId
  const notAnswerer = [host, ...guests].find((p) => p.getState().self.id !== answerer)!
  notAnswerer.getState().act({ type: 'CHOOSE_KIND', kind: 'dare' })
  await flush()
  expect(host.getState().room!.game!.phase).toBe('choosing')
})

test('duplicate intents are applied once and older states are ignored', async () => {
  const { bus, host, guests } = await lobbyWith('a', 'b')
  await host.getState().start({ categories: ['fun'] })
  await flush()
  const intent = {
    id: 'same',
    from: 'b',
    type: 'action' as const,
    action: { type: 'SPIN' as const },
  }
  bus.publish({ kind: 'intent', code: host.getState().room!.code, intent })
  bus.publish({ kind: 'intent', code: host.getState().room!.code, intent })
  await flush()
  expect(host.getState().room!.game!.phase).toBe('spinning')
  const current = guests[0]!.getState().room!
  bus.publish({
    kind: 'state',
    code: current.code,
    state: { ...current, version: current.version - 1, game: null },
  })
  await flush()
  expect(guests[0]!.getState().room!.game).not.toBeNull()
})

test('when the host leaves, the next member becomes host and the game goes on', async () => {
  const { host, guests } = await lobbyWith('a', 'b', 'c')
  await host.getState().start({ categories: ['fun'] })
  await flush()
  host.getState().leave()
  await flush()
  const [b, c] = guests
  expect(b!.getState().role).toBe('host')
  expect(c!.getState().room!.hostId).toBe('b')
  c!.getState().act({ type: 'SPIN' })
  await flush()
  expect(c!.getState().room!.game!.phase).toBe('spinning')
})

test('joining fails clearly for an unknown, full or started room', async () => {
  const bus = createInMemoryBus()
  const stranger = phone(bus, 'z')
  expect(await stranger.getState().joinRoom('ABCDEF')).toBe('roomNotFound')

  const { bus: bus2, host, code } = await lobbyWith('a', 'b')
  await host.getState().start({ categories: ['fun'] })
  await flush()
  expect(await phone(bus2, 'late').getState().joinRoom(code)).toBe('roomStarted')

  // A free host's room is full at 6 players (12 with Premium, see premiumRoom.test).
  const ids = Array.from({ length: 6 }, (_, i) => `p${i}`)
  const full = await lobbyWith(...ids)
  expect(await phone(full.bus, 'seventh').getState().joinRoom(full.code)).toBe('roomFull')
})

test('reactions reach every phone', async () => {
  const { host, guests } = await lobbyWith('a', 'b')
  guests[0]!.getState().react('fire')
  await flush()
  expect(host.getState().room!.reactions.at(-1)).toMatchObject({ from: 'b', emoji: 'fire' })
})
