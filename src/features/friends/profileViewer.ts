import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

const viewer = createStore<{ id: string | null }>()(() => ({ id: null }))

/** Opens the public profile of a player (shown by PublicProfileSheet, anywhere in the app). */
export function openProfile(id: string): void {
  viewer.setState({ id })
}

export function closeProfile(): void {
  viewer.setState({ id: null })
}

export function useViewedProfile(): string | null {
  return useStore(viewer, (s) => s.id)
}
