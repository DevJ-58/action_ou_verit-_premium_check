import { useEffect } from 'react'
import { useSettings } from '@/features/settings/settingsStore'
import { music } from './music'

/** Plays the background melody while a game screen is open, music is on and the app is visible. */
export function useGameMusic(active = true): void {
  const on = useSettings((s) => s.music)
  useEffect(() => {
    if (!active || !on) return
    const sync = () => (document.hidden ? music.stop() : music.start())
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      music.stop()
    }
  }, [active, on])
}
