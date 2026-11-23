// Test helper: a stand-in for RTCPeerConnection that records what happens (imported by tests only).
export class FakePeer {
  static all: FakePeer[] = []
  tracks: MediaStreamTrack[] = []
  local: RTCSessionDescriptionInit | null = null
  remote: RTCSessionDescriptionInit | null = null
  candidates: RTCIceCandidateInit[] = []
  closed = false
  connectionState: RTCPeerConnectionState = 'new'
  onicecandidate: ((e: { candidate: RTCIceCandidateInit | null }) => void) | null = null
  ontrack: ((e: { streams: MediaStream[]; track: MediaStreamTrack }) => void) | null = null
  onconnectionstatechange: (() => void) | null = null
  constructor() {
    FakePeer.all.push(this)
  }
  addTrack(track: MediaStreamTrack) {
    this.tracks.push(track)
    return { replaceTrack: async (t: MediaStreamTrack) => void (this.tracks = [t]) }
  }
  getSenders() {
    return this.tracks.map((t, i) => ({
      track: t,
      replaceTrack: async (next: MediaStreamTrack) => void (this.tracks[i] = next),
    }))
  }
  async createOffer() {
    return { type: 'offer' as const, sdp: 'offer-sdp' }
  }
  async createAnswer() {
    return { type: 'answer' as const, sdp: 'answer-sdp' }
  }
  async setLocalDescription(d: RTCSessionDescriptionInit) {
    this.local = d
    this.onicecandidate?.({ candidate: { candidate: `cand-${d.type}` } })
  }
  async setRemoteDescription(d: RTCSessionDescriptionInit) {
    this.remote = d
    if (d.type === 'offer') {
      const stream = { id: 'remote-stream' } as unknown as MediaStream
      this.ontrack?.({ streams: [stream], track: {} as MediaStreamTrack })
    }
    this.connectionState = 'connected'
    this.onconnectionstatechange?.()
  }
  async addIceCandidate(c: RTCIceCandidateInit) {
    this.candidates.push(c)
  }
  close() {
    this.closed = true
  }
}
