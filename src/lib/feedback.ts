import { settingsStore } from '@/features/settings/settingsStore'

let audio: AudioContext | null = null

function tone(frequency: number, durationMs: number, gain = 0.06) {
  if (!settingsStore.getState().sound) return
  try {
    audio ??= new AudioContext()
    const osc = audio.createOscillator()
    const amp = audio.createGain()
    osc.frequency.value = frequency
    osc.type = 'triangle'
    amp.gain.setValueAtTime(gain, audio.currentTime)
    amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + durationMs / 1000)
    osc.connect(amp).connect(audio.destination)
    osc.start()
    osc.stop(audio.currentTime + durationMs / 1000)
  } catch {
    // Audio unavailable: stay silent.
  }
}

function vibrate(pattern: number | number[]) {
  if (!settingsStore.getState().haptics) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Vibration unsupported.
  }
}

/** Short sounds and vibrations, respecting the player's settings. */
export const feedback = {
  spinTick() {
    tone(660, 60, 0.03)
    vibrate(8)
  },
  reveal() {
    tone(520, 120)
    tone(780, 180)
    vibrate([20, 40, 20])
  },
  success() {
    tone(880, 160)
    vibrate(30)
  },
}
