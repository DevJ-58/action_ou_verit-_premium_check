import { defaultPeer, type PeerFactory, type Signal, type SignalTransport } from './types'

/** Applies remote ICE candidates once the remote description is known. */
function iceQueue(pc: RTCPeerConnection) {
  const waiting: RTCIceCandidateInit[] = []
  let ready = false
  return {
    add: (c: RTCIceCandidateInit) => {
      if (ready) void pc.addIceCandidate(c).catch(() => {})
      else waiting.push(c)
    },
    open: () => {
      ready = true
      for (const c of waiting.splice(0)) void pc.addIceCandidate(c).catch(() => {})
    },
  }
}

export interface Broadcaster {
  /** Swaps the camera (front / back) for every viewer. */
  replaceStream(stream: MediaStream): void
  stop(): void
}

/** The phone filming: one connection per viewer who says hello. */
export function createBroadcaster(input: {
  code: string
  selfId: string
  stream: MediaStream
  transport: SignalTransport
  createPeer?: PeerFactory
}): Broadcaster {
  const { code, selfId, transport, createPeer = defaultPeer } = input
  let stream = input.stream
  const peers = new Map<string, { pc: RTCPeerConnection; ice: ReturnType<typeof iceQueue> }>()
  const send = (to: string, body: Signal['body']) =>
    transport.send(code, { from: selfId, to, body })

  const close = (viewer: string) => {
    peers.get(viewer)?.pc.close()
    peers.delete(viewer)
  }

  async function connect(viewer: string) {
    close(viewer)
    const pc = createPeer()
    const ice = iceQueue(pc)
    peers.set(viewer, { pc, ice })
    pc.onicecandidate = (e) => {
      if (e.candidate)
        send(viewer, { type: 'ice', candidate: e.candidate.toJSON?.() ?? e.candidate })
    }
    for (const track of stream.getTracks()) pc.addTrack(track, stream)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    send(viewer, { type: 'offer', sdp: offer.sdp ?? '' })
  }

  const off = transport.onSignal(code, selfId, (signal) => {
    if (signal.channel === 'voice') return
    const { from, body } = signal
    if (body.type === 'hello') void connect(from).catch(() => close(from))
    else if (body.type === 'bye') close(from)
    else if (body.type === 'answer') {
      const peer = peers.get(from)
      if (!peer) return
      void peer.pc
        .setRemoteDescription({ type: 'answer', sdp: body.sdp })
        .then(peer.ice.open)
        .catch(() => close(from))
    } else if (body.type === 'ice') peers.get(from)?.ice.add(body.candidate)
  })

  return {
    replaceStream(next) {
      stream = next
      const [video] = next.getVideoTracks?.() ?? next.getTracks()
      for (const { pc } of peers.values()) {
        for (const sender of pc.getSenders()) {
          if (sender.track?.kind === 'video' && video) void sender.replaceTrack(video)
        }
      }
    },
    stop() {
      off()
      for (const viewer of [...peers.keys()]) {
        send(viewer, { type: 'bye' })
        close(viewer)
      }
      stream.getTracks().forEach((t) => t.stop())
    },
  }
}

export type ViewerState = 'connecting' | 'connected' | 'failed'

export interface Viewer {
  stop(): void
}

/** A phone watching: says hello (again until it gets an offer), answers, shows the stream. */
export function createViewer(input: {
  code: string
  selfId: string
  by: string
  transport: SignalTransport
  createPeer?: PeerFactory
  onStream(stream: MediaStream): void
  onState(state: ViewerState): void
  retryMs?: number
}): Viewer {
  const { code, selfId, by, transport, createPeer = defaultPeer, onStream, onState } = input
  let pc: RTCPeerConnection | null = null
  let ice: ReturnType<typeof iceQueue> | null = null
  let offered = false
  // Candidates can arrive before the offer they belong to: keep them for the next connection.
  const early: RTCIceCandidateInit[] = []
  const send = (body: Signal['body']) => transport.send(code, { from: selfId, to: by, body })

  const off = transport.onSignal(code, selfId, (signal) => {
    if (signal.channel === 'voice' || signal.from !== by) return
    const { body } = signal
    if (body.type === 'offer') {
      offered = true
      pc?.close()
      const peer = createPeer()
      pc = peer
      ice = iceQueue(peer)
      const queue = ice
      for (const c of early.splice(0)) queue.add(c)
      peer.onicecandidate = (e) => {
        if (e.candidate) send({ type: 'ice', candidate: e.candidate.toJSON?.() ?? e.candidate })
      }
      peer.ontrack = (e) => {
        if (e.streams[0]) onStream(e.streams[0])
      }
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'connected') onState('connected')
        if (peer.connectionState === 'failed') onState('failed')
      }
      void (async () => {
        await peer.setRemoteDescription({ type: 'offer', sdp: body.sdp })
        queue.open()
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        send({ type: 'answer', sdp: answer.sdp ?? '' })
      })().catch(() => onState('failed'))
    } else if (body.type === 'ice') {
      if (ice) ice.add(body.candidate)
      else early.push(body.candidate)
    } else if (body.type === 'bye') {
      pc?.close()
      pc = null
    }
  })

  onState('connecting')
  send({ type: 'hello' })
  // The phone filming may not have its camera ready yet: ask again until it answers.
  const retry = setInterval(
    () => (offered ? clearInterval(retry) : send({ type: 'hello' })),
    input.retryMs ?? 2500,
  )

  return {
    stop() {
      clearInterval(retry)
      off()
      send({ type: 'bye' })
      pc?.close()
      pc = null
    },
  }
}
