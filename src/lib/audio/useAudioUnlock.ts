import { useEffect } from 'react'
import { installAudioUnlock } from './unlock'

/** Lets sounds play once the player has touched the screen (browser rule). */
export function useAudioUnlock(): void {
  useEffect(() => installAudioUnlock(), [])
}
