import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

/** Chrome / Edge / Samsung Internet event that lets the app show its own Install button. */
export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const installStore = createStore<{
  prompt: InstallPromptEvent | null
  installed: boolean
}>()(() => ({ prompt: null, installed: false }))

export function useInstall<T>(
  selector: (s: { prompt: InstallPromptEvent | null; installed: boolean }) => T,
): T {
  return useStore(installStore, selector)
}

/** Call once at startup, before the browser fires its install event. */
export function listenForInstall(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installStore.setState({ prompt: event as InstallPromptEvent })
  })
  window.addEventListener('appinstalled', () =>
    installStore.setState({ prompt: null, installed: true }),
  )
}

/** Already running as an installed app. */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

/** iPhone / iPad: installing is done by hand from the Share menu. */
export function isIos(): boolean {
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}
