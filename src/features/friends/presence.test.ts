import { createInMemoryBus } from '@/features/room/bus'
import { createLocalPresence } from './presence'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

test('a player who opens the app is seen online by others, and offline once they leave', async () => {
  const bus = createInMemoryBus()
  const awa = createLocalPresence(bus, { heartbeatMs: 20 })
  const kofi = createLocalPresence(bus, { heartbeatMs: 20 })
  let online: ReadonlySet<string> = new Set()
  const off = kofi.onOnline((ids) => (online = ids))
  const leave = awa.track('awa')
  await wait(50)
  expect(online.has('awa')).toBe(true)
  leave()
  await wait(50)
  expect(online.has('awa')).toBe(false)
  off()
})

test('someone who vanishes without saying goodbye is offline after a few missed beats', async () => {
  vi.useFakeTimers()
  const bus = createInMemoryBus()
  const awa = createLocalPresence(bus, { heartbeatMs: 1000 })
  const kofi = createLocalPresence(bus, { heartbeatMs: 1000 })
  let online: ReadonlySet<string> = new Set()
  kofi.onOnline((ids) => (online = ids))
  awa.track('awa')
  await vi.advanceTimersByTimeAsync(1500)
  expect(online.has('awa')).toBe(true)
  awa.silence()
  await vi.advanceTimersByTimeAsync(5000)
  expect(online.has('awa')).toBe(false)
  vi.useRealTimers()
})
