import { settingsStore } from '@/features/settings/settingsStore'
import { audioBuses } from './context'
import { bass, mallet, shaker } from './voices'

const BPM = 96
const STEP = 60 / BPM / 2 // eighth notes
const LOOKAHEAD = 0.15
const TICK_MS = 30

// D minor pentatonic, two octaves (Hz).
const SCALE = [293.66, 349.23, 392, 440, 523.25, 587.33, 698.46, 783.99]
// One root per bar: Dm, Bb, F, C.
const ROOTS = [73.42, 58.27, 87.31, 65.41]
// Four 8-step melodic cells (scale indexes, null = rest), balafon-like.
const CELLS: (number | null)[][] = [
  [5, null, 3, 4, null, 3, 1, null],
  [4, null, 2, 3, null, 5, null, 3],
  [3, 4, null, 2, 1, null, 2, null],
  [2, null, 1, 0, null, 1, 3, null],
]

let timer: ReturnType<typeof setInterval> | null = null
let next = 0
let step = 0

function schedule(ctx: AudioContext, out: AudioNode, index: number, at: number) {
  const bar = Math.floor(index / 16) % 4
  const pos = index % 16
  const cell = CELLS[(bar + Math.floor(index / 64)) % 4]!
  const note = cell[pos % 8]
  if (note !== null && note !== undefined)
    mallet(ctx, out, SCALE[note]!, at, pos % 4 === 0 ? 0.42 : 0.3)
  if (pos === 0 || pos === 6 || pos === 10) bass(ctx, out, ROOTS[bar]!, at, pos === 0 ? 0.7 : 0.5)
  shaker(ctx, out, at, pos % 2 === 1 ? 0.07 : 0.035)
}

function tick() {
  if (!settingsStore.getState().music) return music.stop()
  const audio = audioBuses()
  if (!audio) return
  if (next < audio.ctx.currentTime) next = audio.ctx.currentTime + 0.05
  while (next < audio.ctx.currentTime + LOOKAHEAD) {
    schedule(audio.ctx, audio.music, step, next)
    next += STEP
    step++
  }
}

let unsubscribe: (() => void) | null = null

/** The background melody: a soft loop generated live (no audio file). */
export const music = {
  start(): void {
    if (timer || !settingsStore.getState().music) return
    next = 0
    step = 0
    tick()
    timer = setInterval(tick, TICK_MS)
    unsubscribe = settingsStore.subscribe((s) => {
      if (!s.music) music.stop()
    })
  },
  stop(): void {
    if (timer) clearInterval(timer)
    timer = null
    unsubscribe?.()
    unsubscribe = null
  },
  playing(): boolean {
    return timer !== null
  },
}
