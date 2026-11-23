type Factory = () => AudioContext

const defaultFactory: Factory = () => {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) throw new Error('No Web Audio')
  return new Ctor()
}

let factory: Factory = defaultFactory
let ctx: AudioContext | null = null
let buses: { sfx: GainNode; music: GainNode } | null = null

/** Tests swap the AudioContext for a fake. */
export function setAudioFactory(next: Factory): void {
  factory = next
  ctx = null
  buses = null
}

/** The shared audio context, created on demand and resumed if the browser suspended it. */
export function audioContext(): AudioContext | null {
  try {
    ctx ??= factory()
  } catch {
    return null
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

/** Separate volumes for sound effects and music. */
export function audioBuses(): { ctx: AudioContext; sfx: GainNode; music: GainNode } | null {
  const c = audioContext()
  if (!c) return null
  if (!buses) {
    const sfx = c.createGain()
    sfx.gain.value = 0.5
    sfx.connect(c.destination)
    const music = c.createGain()
    music.gain.value = 0.16
    music.connect(c.destination)
    buses = { sfx, music }
  }
  return { ctx: c, ...buses }
}
