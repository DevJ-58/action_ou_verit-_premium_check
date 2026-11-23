import { createInMemoryBus } from '@/features/room/bus'
import { createBroadcaster, createViewer } from './session'
import { FakePeer } from './fakePeer'
import { createLocalSignals } from './localSignals'

const flush = async () => {
  for (let i = 0; i < 12; i++) await new Promise((r) => setTimeout(r, 0))
}
const track = { id: 'cam', kind: 'video', stop: vi.fn() } as unknown as MediaStreamTrack
const stream = { getTracks: () => [track] } as unknown as MediaStream
const peer = () => new FakePeer() as unknown as RTCPeerConnection

beforeEach(() => (FakePeer.all = []))

function setup() {
  const bus = createInMemoryBus()
  const broadcaster = createBroadcaster({
    code: 'ABCDEF',
    selfId: 'kofi',
    stream,
    transport: createLocalSignals(bus),
    createPeer: peer,
  })
  const watch = (selfId: string) => {
    const onStream = vi.fn()
    const onState = vi.fn()
    const viewer = createViewer({
      code: 'ABCDEF',
      selfId,
      by: 'kofi',
      transport: createLocalSignals(bus),
      createPeer: peer,
      onStream,
      onState,
    })
    return { viewer, onStream, onState }
  }
  return { broadcaster, watch }
}

test('a viewer says hello, gets the camera through an offer/answer, and sees the video', async () => {
  const { watch } = setup()
  const awa = watch('awa')
  await flush()
  const [sender, receiver] = FakePeer.all
  expect(sender!.tracks).toEqual([track])
  expect(receiver!.remote).toMatchObject({ type: 'offer', sdp: 'offer-sdp' })
  expect(sender!.remote).toMatchObject({ type: 'answer', sdp: 'answer-sdp' })
  expect(sender!.candidates).toEqual([{ candidate: 'cand-answer' }])
  expect(receiver!.candidates).toEqual([{ candidate: 'cand-offer' }])
  expect(awa.onStream).toHaveBeenCalledWith(expect.objectContaining({ id: 'remote-stream' }))
  expect(awa.onState).toHaveBeenLastCalledWith('connected')
})

test('each viewer gets its own connection', async () => {
  const { watch } = setup()
  watch('awa')
  watch('ines')
  await flush()
  expect(FakePeer.all.filter((p) => p.tracks.length > 0)).toHaveLength(2)
})

test('stopping closes every connection and the camera; a viewer leaving closes theirs', async () => {
  const { broadcaster, watch } = setup()
  const awa = watch('awa')
  watch('ines')
  await flush()
  awa.viewer.stop()
  await flush()
  const senders = FakePeer.all.filter((p) => p.tracks.length > 0)
  expect(senders.filter((p) => p.closed)).toHaveLength(1)
  broadcaster.stop()
  expect(senders.every((p) => p.closed)).toBe(true)
  expect(track.stop).toHaveBeenCalled()
})
