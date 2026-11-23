/**
 * Real-time pitch shifter with plain Web Audio nodes (the « Jungle » technique):
 * two delay lines whose delay time sweeps up or down, cross-faded so the sweep is not heard.
 */
const DELAY = 0.1
const FADE = 0.05
const BUFFER = 0.1

function fadeBuffer(ctx: AudioContext, active: number, fade: number): AudioBuffer {
  const rate = ctx.sampleRate
  const length = Math.round((active + fade) * rate) * 2
  const buffer = ctx.createBuffer(1, length, rate)
  const p = buffer.getChannelData(0)
  const fadeLength = fade * rate
  const fadeIndex1 = fadeLength
  const fadeIndex2 = length / 2 - fadeLength
  for (let i = 0; i < length / 2; i++) {
    let value = 1
    if (i < fadeIndex1) value = Math.sqrt(i / fadeLength)
    else if (i >= fadeIndex2) value = Math.sqrt(1 - (i - fadeIndex2) / fadeLength)
    p[i] = value
  }
  return buffer
}

function sweepBuffer(ctx: AudioContext, active: number, fade: number, up: boolean): AudioBuffer {
  const rate = ctx.sampleRate
  const half = Math.round((active + fade) * rate)
  const buffer = ctx.createBuffer(1, half * 2, rate)
  const p = buffer.getChannelData(0)
  for (let i = 0; i < half; i++) p[i] = up ? (half - i) / half : i / half
  return buffer
}

export interface PitchShifter {
  input: GainNode
  output: GainNode
  stop(): void
}

/** `amount`: -1 (an octave-ish lower) … +1 (higher); 0 leaves the pitch alone. */
export function createPitchShifter(ctx: AudioContext, amount: number): PitchShifter {
  const input = ctx.createGain()
  const output = ctx.createGain()
  const up = amount > 0
  const sources: AudioBufferSourceNode[] = []
  const looped = (buffer: AudioBuffer, at: number) => {
    const s = ctx.createBufferSource()
    s.buffer = buffer
    s.loop = true
    s.start(at)
    sources.push(s)
    return s
  }
  const t = ctx.currentTime + 0.05
  const sweep = sweepBuffer(ctx, BUFFER, FADE, up)
  const fade = fadeBuffer(ctx, BUFFER, FADE)
  for (const offset of [0, BUFFER]) {
    const delay = ctx.createDelay()
    const mod = looped(sweep, t + offset)
    const modGain = ctx.createGain()
    modGain.gain.value = DELAY * Math.abs(amount)
    mod.connect(modGain)
    modGain.connect(delay.delayTime)
    const mix = ctx.createGain()
    mix.gain.value = 0
    looped(fade, t + offset).connect(mix.gain)
    input.connect(delay)
    delay.connect(mix)
    mix.connect(output)
  }
  return {
    input,
    output,
    stop: () =>
      sources.forEach((s) => {
        try {
          s.stop()
        } catch {
          // Already stopped.
        }
      }),
  }
}
