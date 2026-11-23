import {
  defaultPeer,
  type PeerFactory,
  type Signal,
  type SignalTransport,
} from '@/features/live/types'

/** One audio connection per pair of players with their mic on. */
interface Link {
  pc: RTCPeerConnection
  /** Remote candidates waiting for the remote description. */
  pending: RTCIceCandidateInit[]
  ready: boolean
  createdAt: number
}

export interface VoiceMesh {
  /** Who has their mic on right now (this phone included or not). */
  update(talking: readonly string[]): void
  stop(): void
}

/**
 * Live voice between players. In each pair, the player with the smaller id makes the offer;
 * the other says hello until it gets one (so nobody misses the start).
 */
export function createVoiceMesh(input: {
  code: string
  selfId: string
  stream: MediaStream
  transport: SignalTransport
  createPeer?: PeerFactory
  onStream(from: string, stream: MediaStream | null): void
  retryMs?: number
}): VoiceMesh {
  const { code, selfId, stream, transport, createPeer = defaultPeer, onStream } = input
  const links = new Map<string, Link>()
  let wanted = new Set<string>()
  const send = (to: string, body: Signal['body']) =>
    transport.send(code, { from: selfId, to, body, channel: 'voice' })

  function close(peer: string) {
    const link = links.get(peer)
    if (!link) return
    link.pc.close()
    links.delete(peer)
    onStream(peer, null)
  }

  function open(peer: string): Link {
    close(peer)
    const pc = createPeer()
    const link: Link = { pc, pending: [], ready: false, createdAt: Date.now() }
    links.set(peer, link)
    pc.onicecandidate = (e) => {
      if (e.candidate) send(peer, { type: 'ice', candidate: e.candidate.toJSON?.() ?? e.candidate })
    }
    pc.ontrack = (e) => {
      if (e.streams[0]) onStream(peer, e.streams[0])
    }
    for (const track of stream.getTracks()) pc.addTrack(track, stream)
    return link
  }

  function remoteReady(link: Link) {
    link.ready = true
    for (const c of link.pending.splice(0)) void link.pc.addIceCandidate(c).catch(() => {})
  }

  async function offer(peer: string) {
    const link = open(peer)
    const description = await link.pc.createOffer()
    await link.pc.setLocalDescription(description)
    send(peer, { type: 'offer', sdp: description.sdp ?? '' })
  }

  const off = transport.onSignal(code, selfId, (signal) => {
    if (signal.channel !== 'voice') return
    const { from, body } = signal
    if (!wanted.has(from)) return
    if (body.type === 'hello' && selfId < from) {
      // An offer already on its way (or answered) needs no second one.
      const link = links.get(from)
      if (link && (link.ready || Date.now() - link.createdAt < 4000)) return
      void offer(from).catch(() => close(from))
    } else if (body.type === 'offer') {
      const link = open(from)
      void (async () => {
        await link.pc.setRemoteDescription({ type: 'offer', sdp: body.sdp })
        remoteReady(link)
        const answer = await link.pc.createAnswer()
        await link.pc.setLocalDescription(answer)
        send(from, { type: 'answer', sdp: answer.sdp ?? '' })
      })().catch(() => close(from))
    } else if (body.type === 'answer') {
      const link = links.get(from)
      if (link) {
        void link.pc
          .setRemoteDescription({ type: 'answer', sdp: body.sdp })
          .then(() => remoteReady(link))
          .catch(() => close(from))
      }
    } else if (body.type === 'ice') {
      const link = links.get(from)
      if (link?.ready) void link.pc.addIceCandidate(body.candidate).catch(() => {})
      else link?.pending.push(body.candidate)
    } else if (body.type === 'bye') close(from)
  })

  // The larger id keeps asking for an offer until it is connected.
  const retry = setInterval(() => {
    for (const peer of wanted) if (selfId > peer && !links.has(peer)) send(peer, { type: 'hello' })
  }, input.retryMs ?? 2000)

  return {
    update(talking) {
      const next = new Set(talking.filter((id) => id !== selfId))
      // Not talking ourselves: nobody to connect to.
      if (!talking.includes(selfId)) next.clear()
      for (const peer of [...links.keys()]) if (!next.has(peer)) close(peer)
      const added = [...next].filter((p) => !wanted.has(p))
      wanted = next
      for (const peer of added) {
        if (selfId < peer) void offer(peer).catch(() => close(peer))
        else send(peer, { type: 'hello' })
      }
    },
    stop() {
      clearInterval(retry)
      off()
      for (const peer of [...links.keys()]) {
        send(peer, { type: 'bye' })
        close(peer)
      }
      wanted = new Set()
      stream.getTracks().forEach((t) => t.stop())
    },
  }
}
