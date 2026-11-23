import { createPitchShifter } from './pitchShift'
import { VOICES, type VoiceId } from './presets'

export interface VoiceChain {
  /** The transformed voice, ready to send to the others. */
  stream: MediaStream
  stop(): void
}

function curve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024
  const c = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    c[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x))
  }
  return c
}

/** Mic → pitch shift → effects of the voice → a new stream (the natural voice never leaves). */
export function changeVoice(ctx: AudioContext, mic: MediaStream, voice: VoiceId): VoiceChain {
  const preset: { pitch: number; ring?: number; drive?: number; echo?: number; band?: boolean } =
    VOICES[voice]
  const stoppers: (() => void)[] = []
  const source = ctx.createMediaStreamSource(mic)
  const destination = ctx.createMediaStreamDestination()
  let node: AudioNode = source

  if (preset.pitch !== 0) {
    const shifter = createPitchShifter(ctx, preset.pitch)
    node.connect(shifter.input)
    node = shifter.output
    stoppers.push(shifter.stop)
  }
  if (preset.ring) {
    // Ring modulation (metallic, robotic), mixed with the shifted voice so words stay clear.
    const ring = ctx.createGain()
    ring.gain.value = 0
    const osc = ctx.createOscillator()
    osc.frequency.value = preset.ring
    osc.connect(ring.gain)
    osc.start()
    stoppers.push(() => osc.stop())
    const mix = ctx.createGain()
    const dry = ctx.createGain()
    dry.gain.value = 0.55
    node.connect(ring)
    node.connect(dry)
    ring.connect(mix)
    dry.connect(mix)
    node = mix
  }
  if (preset.band) {
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 1500
    band.Q.value = 0.9
    node.connect(band)
    node = band
  }
  if (preset.drive) {
    const shaper = ctx.createWaveShaper()
    shaper.curve = curve(preset.drive)
    node.connect(shaper)
    node = shaper
  }
  const out = ctx.createGain()
  out.gain.value = 1.8
  node.connect(out)
  if (preset.echo) {
    const delay = ctx.createDelay()
    delay.delayTime.value = 0.18
    const feedback = ctx.createGain()
    feedback.gain.value = preset.echo
    out.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(destination)
  }
  // Evens out the loudness (quiet words louder, shouts held back).
  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = -20
  limiter.ratio.value = 6
  out.connect(limiter)
  limiter.connect(destination)

  return {
    stream: destination.stream,
    stop: () => {
      stoppers.forEach((s) => s())
      source.disconnect()
    },
  }
}
