import { createInMemoryBus } from '@/features/room/bus'
import { FakePeer } from '@/features/live/fakePeer'
import { createLocalSignals } from '@/features/live/localSignals'
import { createVoiceMesh } from './voiceMesh'

const flush = async () => {
  for (let i = 0; i < 16; i++) await new Promise((r) => setTimeout(r, 0))
}
const peer = () => new FakePeer() as unknown as RTCPeerConnection
beforeEach(() => (FakePeer.all = []))

function phone(bus: ReturnType<typeof createInMemoryBus>, id: string) {
  const track = { id: `${id}-voice`, kind: 'audio', stop: vi.fn() } as unknown as MediaStreamTrack
  const heard = new Map<string, MediaStream | null>()
  const mesh = createVoiceMesh({
    code: 'ABCDEF',
    selfId: id,
    stream: { getTracks: () => [track] } as unknown as MediaStream,
    transport: createLocalSignals(bus),
    createPeer: peer,
    onStream: (from, stream) => heard.set(from, stream),
    retryMs: 30,
  })
  return { mesh, heard, track }
}

test('two players with their mic on hear each other', async () => {
  const bus = createInMemoryBus()
  const a = phone(bus, 'a')
  const b = phone(bus, 'b')
  a.mesh.update(['a', 'b'])
  b.mesh.update(['a', 'b'])
  await flush()
  expect(a.heard.get('b')).toBeTruthy()
  expect(b.heard.get('a')).toBeTruthy()
  expect(FakePeer.all).toHaveLength(2)
  expect(FakePeer.all.every((p) => p.tracks.length === 1)).toBe(true)
})

test('three players: everyone hears everyone (one connection per pair)', async () => {
  const bus = createInMemoryBus()
  const phones = ['a', 'b', 'c'].map((id) => phone(bus, id))
  for (const p of phones) p.mesh.update(['a', 'b', 'c'])
  await flush()
  for (const [i, p] of phones.entries()) {
    const others = ['a', 'b', 'c'].filter((_, j) => j !== i)
    expect([...p.heard.keys()].sort()).toEqual(others)
  }
  expect(FakePeer.all).toHaveLength(6)
})

test('a player turning their mic off is no longer heard; stopping releases everything', async () => {
  const bus = createInMemoryBus()
  const a = phone(bus, 'a')
  const b = phone(bus, 'b')
  a.mesh.update(['a', 'b'])
  b.mesh.update(['a', 'b'])
  await flush()
  a.mesh.update(['a'])
  await flush()
  expect(a.heard.get('b')).toBeNull()
  b.mesh.stop()
  expect(b.track.stop).toHaveBeenCalled()
  expect(FakePeer.all.every((p) => p.closed)).toBe(true)
})

test('voice signals never reach the live video, and the other way round', async () => {
  const bus = createInMemoryBus()
  const a = phone(bus, 'a')
  createLocalSignals(bus).send('ABCDEF', { from: 'b', to: 'a', body: { type: 'hello' } })
  await flush()
  expect(FakePeer.all).toHaveLength(0)
  a.mesh.stop()
})
