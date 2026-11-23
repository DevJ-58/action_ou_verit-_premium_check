// Test helper: a minimal AudioContext that records what is played (imported by *.test.ts only).
const param = () => ({
  value: 0,
  setValueAtTime: () => {},
  linearRampToValueAtTime: () => {},
  exponentialRampToValueAtTime: () => {},
  cancelScheduledValues: () => {},
  setTargetAtTime: () => {},
})
const node = () => ({ connect: (next: unknown) => next, disconnect: () => {} })

export class FakeAudioContext {
  static started: { frequency: number; at: number }[] = []
  static resumed = 0
  state: 'suspended' | 'running' = 'suspended'
  sampleRate = 44100
  destination = node()
  private t0 = Date.now()
  get currentTime() {
    return (Date.now() - this.t0) / 1000
  }
  resume() {
    FakeAudioContext.resumed++
    this.state = 'running'
    return Promise.resolve()
  }
  createGain() {
    return { ...node(), gain: param() }
  }
  createBiquadFilter() {
    return { ...node(), type: 'lowpass', frequency: param(), Q: param() }
  }
  createOscillator() {
    const osc = {
      ...node(),
      type: 'sine',
      frequency: param(),
      start: (at = 0) => FakeAudioContext.started.push({ frequency: osc.frequency.value, at }),
      stop: () => {},
    }
    return osc
  }
  createDelay() {
    return { ...node(), delayTime: param() }
  }
  createWaveShaper() {
    return { ...node(), curve: null as Float32Array | null, oversample: 'none' }
  }
  createDynamicsCompressor() {
    return { ...node(), threshold: param(), ratio: param(), knee: param() }
  }
  createMediaStreamSource(stream: unknown) {
    FakeAudioContext.sources.push(stream)
    return node()
  }
  createMediaStreamDestination() {
    return { ...node(), stream: { id: 'processed', getAudioTracks: () => [{ kind: 'audio' }] } }
  }
  static sources: unknown[] = []
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) }
  }
  createBufferSource() {
    return { ...node(), buffer: null, loop: false, start: () => {}, stop: () => {} }
  }
  static reset() {
    FakeAudioContext.started = []
    FakeAudioContext.resumed = 0
    FakeAudioContext.sources = []
  }
}
