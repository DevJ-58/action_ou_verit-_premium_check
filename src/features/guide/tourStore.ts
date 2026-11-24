import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { settingsStore, type TourName } from '@/features/settings/settingsStore'

interface TourState {
  active: TourName | null
}

export const tourStore = createStore<TourState>()(() => ({ active: null }))

export const startTour = (name: TourName) => tourStore.setState({ active: name })
export const stopTour = () => tourStore.setState({ active: null })

/** Closes the running guide and remembers it was seen, so it does not start by itself again. */
export function endTour() {
  const { active } = tourStore.getState()
  if (active) settingsStore.getState().markTourSeen(active)
  stopTour()
}

export function useActiveTour(): TourName | null {
  return useStore(tourStore, (s) => s.active)
}
