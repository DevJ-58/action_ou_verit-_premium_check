import { audioContext } from './context'

const EVENTS = ['pointerdown', 'keydown', 'touchend'] as const

/**
 * Browsers only allow sound after a tap or key press. Every gesture makes sure
 * the audio context exists and is running (it can be suspended again in the background).
 * Returns a function that removes the listeners.
 */
export function installAudioUnlock(): () => void {
  const unlock = () => {
    const ctx = audioContext()
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {})
  }
  for (const e of EVENTS) document.addEventListener(e, unlock, { capture: true, passive: true })
  return () => {
    for (const e of EVENTS) document.removeEventListener(e, unlock, { capture: true })
  }
}
