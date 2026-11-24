import { act, renderHook } from '@testing-library/react'
import { settingsStore } from '@/features/settings/settingsStore'
import { stopTour, tourStore } from './tourStore'
import { useAutoTour } from './useAutoTour'

beforeEach(() => {
  vi.useFakeTimers()
  stopTour()
  settingsStore.setState({ toursSeen: [], ageConfirmedAt: '2026-01-01' })
})
afterEach(() => vi.useRealTimers())

test('starts the guide once the screen settled, when not seen and ready', () => {
  const { rerender } = renderHook(({ ready }) => useAutoTour('game', ready), {
    initialProps: { ready: false },
  })
  act(() => vi.advanceTimersByTime(2000))
  expect(tourStore.getState().active).toBeNull()
  rerender({ ready: true })
  act(() => vi.advanceTimersByTime(2000))
  expect(tourStore.getState().active).toBe('game')
})

test('never starts a guide already seen, nor over another guide, nor before the age check', () => {
  settingsStore.setState({ toursSeen: ['home'] })
  renderHook(() => useAutoTour('home'))
  act(() => vi.advanceTimersByTime(2000))
  expect(tourStore.getState().active).toBeNull()

  tourStore.setState({ active: 'game' })
  renderHook(() => useAutoTour('lobby'))
  act(() => vi.advanceTimersByTime(2000))
  expect(tourStore.getState().active).toBe('game')

  stopTour()
  settingsStore.setState({ ageConfirmedAt: null })
  renderHook(() => useAutoTour('lobby'))
  act(() => vi.advanceTimersByTime(2000))
  expect(tourStore.getState().active).toBeNull()
})

test('waits while another window (sheet, dialog) is open, then starts', () => {
  const sheet = document.createElement('div')
  sheet.setAttribute('role', 'dialog')
  document.body.append(sheet)
  renderHook(() => useAutoTour('home'))
  act(() => vi.advanceTimersByTime(3000))
  expect(tourStore.getState().active).toBeNull()
  sheet.remove()
  act(() => vi.advanceTimersByTime(3000))
  expect(tourStore.getState().active).toBe('home')
})
