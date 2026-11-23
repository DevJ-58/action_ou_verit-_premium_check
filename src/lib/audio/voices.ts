/** Small synth voices shared by the sound effects and the melody. */

/** A wooden mallet note (balafon / marimba-like): fast attack, short ring. */
export function mallet(ctx: AudioContext, out: AudioNode, freq: number, at: number, gain = 0.5) {
  const amp = ctx.createGain()
  amp.gain.setValueAtTime(0.0001, at)
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.006)
  amp.gain.exponentialRampToValueAtTime(0.0001, at + 0.45)
  amp.connect(out)
  for (const [ratio, level] of [
    [1, 1],
    [3.9, 0.18],
  ] as const) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    g.gain.value = level
    osc.type = 'sine'
    osc.frequency.value = freq * ratio
    osc.connect(g).connect(amp)
    osc.start(at)
    osc.stop(at + 0.5)
  }
}

/** A round bass note. */
export function bass(ctx: AudioContext, out: AudioNode, freq: number, at: number, gain = 0.6) {
  const amp = ctx.createGain()
  amp.gain.setValueAtTime(0.0001, at)
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.02)
  amp.gain.exponentialRampToValueAtTime(0.0001, at + 0.5)
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = freq
  osc.connect(amp).connect(out)
  osc.start(at)
  osc.stop(at + 0.55)
}

let noise: AudioBuffer | null = null

/** A soft shaker hit (filtered noise). */
export function shaker(ctx: AudioContext, out: AudioNode, at: number, gain = 0.08) {
  if (!noise) {
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const src = ctx.createBufferSource()
  src.buffer = noise
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 6000
  const amp = ctx.createGain()
  amp.gain.setValueAtTime(gain, at)
  amp.gain.exponentialRampToValueAtTime(0.0001, at + 0.06)
  src.connect(filter).connect(amp).connect(out)
  src.start(at)
  src.stop(at + 0.08)
}

export function resetVoices(): void {
  noise = null
}
