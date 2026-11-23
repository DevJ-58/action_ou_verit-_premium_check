import { createSeededRng } from '@/engine'
import { createInMemoryBus, type Bus } from './bus'
import { createLocalTransport } from './localTransport'
import { createRoomStore, type RoomStore } from './roomStore'
import type { BusMessage, Member } from './types'

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
const FAST = {
  heartbeatMs: 20,
  hostAbsentMs: 5000,
  joinTimeoutMs: 300,
  resyncMs: 40,
  pullIntentsMs: 40,
}

/** A bus that can lose live messages (like a phone whose connection blinked); stored data stays. */
function lossyBus() {
  const inner = createInMemoryBus()
  let drop: ((m: BusMessage) => boolean) | null = null
  const bus: Bus = { ...inner, publish: (m) => (drop?.(m) ? undefined : inner.publish(m)) }
  return { bus, lose: (rule: ((m: BusMessage) => boolean) | null) => (drop = rule) }
}

function phone(bus: Bus, id: string): RoomStore {
  return createRoomStore({
    transport: createLocalTransport(bus, { heartbeatMs: FAST.heartbeatMs }),
    self: member(id),
    rng: createSeededRng(id.charCodeAt(0)),
    timing: FAST,
  })
}

async function playing() {
  const { bus, lose } = lossyBus()
  const host = phone(bus, 'a')
  const guest = phone(bus, 'b')
  const code = await host.getState().createRoom()
  expect(await guest.getState().joinRoom(code)).toBeNull()
  await host.getState().start({ categories: ['fun'] })
  await flush()
  return { host, guest, lose }
}

test('a phone that missed a state update catches up by itself', async () => {
  const { host, guest, lose } = await playing()
  lose((m) => m.kind === 'state')
  host.getState().act({ type: 'SPIN' })
  await flush()
  expect(guest.getState().room!.game!.phase).toBe('ready')
  lose(null)
  await wait(120)
  expect(guest.getState().room!.game!.phase).toBe('spinning')
  host.getState().leave()
  guest.getState().leave()
})

test('the host applies an action it missed live (the player’s tap is not lost)', async () => {
  const { host, guest, lose } = await playing()
  lose((m) => m.kind === 'intent')
  guest.getState().act({ type: 'SPIN' })
  await flush()
  expect(host.getState().room!.game!.phase).toBe('ready')
  lose(null)
  await wait(120)
  expect(host.getState().room!.game!.phase).toBe('spinning')
  await wait(120)
  expect(guest.getState().room!.game!.phase).toBe('spinning')
  host.getState().leave()
  guest.getState().leave()
})
