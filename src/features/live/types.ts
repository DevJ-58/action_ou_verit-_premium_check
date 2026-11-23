/** Messages that put two phones in contact for a live video (WebRTC signalling). */
export type SignalBody =
  | { type: 'hello' }
  | { type: 'offer'; sdp: string }
  | { type: 'answer'; sdp: string }
  | { type: 'ice'; candidate: RTCIceCandidateInit }
  | { type: 'bye' }

export interface Signal {
  from: string
  to: string
  body: SignalBody
}

export interface SignalTransport {
  send(code: string, signal: Signal): void
  /** Signals addressed to `selfId` in this room. */
  onSignal(code: string, selfId: string, listener: (signal: Signal) => void): () => void
}

/** Public STUN servers: enough for most networks; a TURN relay can be added later. */
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: 'stun:stun.cloudflare.com:3478' },
]

export type PeerFactory = () => RTCPeerConnection
export const defaultPeer: PeerFactory = () => new RTCPeerConnection({ iceServers: ICE_SERVERS })
