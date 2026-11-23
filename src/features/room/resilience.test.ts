import { createSeededRng } from '@/engine'
import { createInMemoryBus } from './bus'
import { createLocalTransport } from './localTransport'
import { createRoomStore, type RoomStore } from './roomStore'
import type { Member } from './types'

const member = (id: string): Member => ({
  id,
  pseudo: id,
  avatarId: '1f981',
  limits: { excludedCategories: [], maxIntensity: 4 },
  customDares: [],
})
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const flush = async () => {
  for (let i = 0; i < 8; i++) await wait(0)
}

const FAST = { heartbeatMs: 20, hostAbsentMs: 120, joinTimeoutMs: 150 }

function phone(bus: ReturnType<typeof createInMemoryBus>, id: string): RoomStore {
  return createRoomStore({
    transport: createLocalTransport(bus, { heartbeatMs: FAST.heartbeatMs }),
    self: member(id),
    rng: createSeededRng(id.charCodeAt(0)),
    timing: FAST,
  })
}

async function room(...ids: string[]) {
  const bus = createInMemoryBus()
  const phones = ids.map((id) => phone(bus, id))
  const code = await phones[0]!.getState().createRoom()
  for (const p of phones.slice(1)) expect(await p.getState().joinRoom(code)).toBeNull()
  await flush()
  return { bus, phones, code }
}

afterEach(() => vi.useRealTimers())

test('joining resolves only once the host has accepted the player', async () => {
  const { phones } = await room('a', 'b')
  expect(phones[1]!.getState().room!.members.map((m) => m.id)).toEqual(['a', 'b'])
})

test('joining a room whose host never answers fails with a clear error', async () => {
  const bus = createInMemoryBus()
  const host = phone(bus, 'a')
  const code = await host.getState().createRoom()
  host.getState().leave() // the host vanishes, the snapshot stays
  expect(await phone(bus, 'b').getState().joinRoom(code)).toBe('joinTimeout')
})

test('intents from someone who is not a member are ignored', async () => {
  const { bus, phones, code } = await room('a', 'b')
  bus.publish({
    kind: 'intent',
    code,
    intent: { id: 'x1', from: 'stranger', type: 'react', emoji: 'fire' },
  })
  bus.publish({ kind: 'intent', code, intent: { id: 'x2', from: 'stranger', type: 'leave' } })
  await flush()
  expect(phones[0]!.getState().room!.reactions).toEqual([])
  expect(phones[0]!.getState().room!.members).toHaveLength(2)
})

test('a player who leaves mid-game is removed from the game too', async () => {
  const { phones } = await room('a', 'b', 'c')
  await phones[0]!.getState().start({ categories: ['fun'] })
  await flush()
  phones[2]!.getState().leave()
  await flush()
  const game = phones[0]!.getState().room!.game!
  expect(game.players.map((p) => p.id)).toEqual(['a', 'b'])
})

test('when the host disappears without leaving, the next present member takes over', async () => {
  const { phones } = await room('a', 'b', 'c')
  await phones[0]!.getState().start({ categories: ['fun'] })
  await flush()
  const before = phones[1]!.getState().room!.version
  phones[0]!.getState().disconnect() // phone locked: no leave, just silence
  await wait(400)
  expect(phones[1]!.getState().role).toBe('host')
  expect(phones[2]!.getState().room!.hostId).toBe('b')
  expect(phones[2]!.getState().room!.version).toBeGreaterThan(before)
  phones[2]!.getState().act({ type: 'SPIN' })
  await flush()
  expect(phones[2]!.getState().room!.game!.phase).toBe('spinning')
})

test('every phone knows who is online', async () => {
  const { phones } = await room('a', 'b')
  await wait(80)
  expect([...phones[0]!.getState().online].sort()).toEqual(['a', 'b'])
  phones[1]!.getState().disconnect()
  await wait(250)
  expect([...phones[0]!.getState().online]).toEqual(['a'])
})
