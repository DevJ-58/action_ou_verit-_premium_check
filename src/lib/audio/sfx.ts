import { settingsStore } from '@/features/settings/settingsStore'
import { audioBuses } from './context'
import { mallet, shaker } from './voices'

// Notes of a D minor pentatonic scale (Hz).
const D5 = 587.33
const F5 = 698.46
const G5 = 783.99
const A5 = 880
const C6 = 1046.5
const D6 = 1174.66
const A4 = 440

/** Each sound: notes as [frequency, delay in seconds, gain]. */
const SOUNDS = {
  tick: [[A5, 0, 0.12]],
  yourTurn: [
    [D5, 0, 0.5],
    [A5, 0.1, 0.5],
    [D6, 0.2, 0.55],
  ],
  reveal: [
    [A4, 0, 0.4],
    [D5, 0.07, 0.45],
    [F5, 0.14, 0.45],
    [A5, 0.21, 0.5],
  ],
  proposal: [[G5, 0, 0.3]],
  message: [
    [F5, 0, 0.35],
    [C6, 0.09, 0.35],
  ],
  reaction: [[D6, 0, 0.25]],
  vote: [
    [A5, 0, 0.3],
    [D6, 0.06, 0.3],
  ],
  success: [
    [D5, 0, 0.45],
    [F5, 0.08, 0.45],
    [A5, 0.16, 0.5],
    [D6, 0.26, 0.55],
  ],
  finish: [
    [D5, 0, 0.45],
    [F5, 0.12, 0.45],
    [G5, 0.24, 0.45],
    [A5, 0.36, 0.5],
    [C6, 0.48, 0.5],
    [D6, 0.6, 0.6],
  ],
} as const satisfies Record<string, readonly (readonly [number, number, number])[]>

export type SoundName = keyof typeof SOUNDS

/** Short game sounds, played on the effects bus if the player allows sounds. */
export const sfx = {
  play(name: SoundName): void {
    if (!settingsStore.getState().sound) return
    const audio = audioBuses()
    if (!audio) return
    const now = audio.ctx.currentTime + 0.01
    for (const [freq, delay, gain] of SOUNDS[name])
      mallet(audio.ctx, audio.sfx, freq, now + delay, gain)
    if (name === 'reveal' || name === 'finish') shaker(audio.ctx, audio.sfx, now, 0.12)
  },
}
