import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import type { TourName } from '@/features/settings/settingsStore'

interface TourState {
  active: TourName | null
}

export const tourStore = createStore<TourState>()(() => ({ active: null }))

export const startTour = (name: TourName) => tourStore.setState({ active: name })
export const stopTour = () => tourStore.setState({ active: null })

export function useActiveTour(): TourName | null {
  return useStore(tourStore, (s) => s.active)
}
