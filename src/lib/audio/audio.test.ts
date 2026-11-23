import { settingsStore } from '@/features/settings/settingsStore'
import { setAudioFactory } from './context'
import { FakeAudioContext } from './fakeAudio'
import { music } from './music'
import { sfx } from './sfx'
import { installAudioUnlock } from './unlock'
import { vibrate } from './haptics'

beforeEach(() => {
  FakeAudioContext.reset()
  setAudioFactory(() => new FakeAudioContext() as unknown as AudioContext)
  settingsStore.setState({ sound: true, haptics: true, music: true })
})
afterEach(() => {
  music.stop()
  vi.useRealTimers()
})

test('a sound effect plays notes when sounds are on, and nothing when they are off', () => {
  sfx.play('yourTurn')
  expect(FakeAudioContext.started.length).toBeGreaterThan(0)
  FakeAudioContext.reset()
  settingsStore.setState({ sound: false })
  sfx.play('reveal')
  expect(FakeAudioContext.started).toHaveLength(0)
})

test('the first tap or key press unlocks (resumes) the audio', () => {
  const remove = installAudioUnlock()
  document.dispatchEvent(new Event('pointerdown'))
  expect(FakeAudioContext.resumed).toBeGreaterThan(0)
  remove()
})

test('vibrations follow the setting', () => {
  const spy = vi.fn()
  Object.defineProperty(navigator, 'vibrate', { value: spy, configurable: true })
  vibrate([20, 40])
  expect(spy).toHaveBeenCalledWith([20, 40])
  settingsStore.setState({ haptics: false })
  vibrate(10)
  expect(spy).toHaveBeenCalledTimes(1)
})

test('the melody keeps playing over time while on, and stops when asked', () => {
  vi.useFakeTimers()
  music.start()
  vi.advanceTimersByTime(3000)
  const played = FakeAudioContext.started.length
  expect(played).toBeGreaterThan(10)
  music.stop()
  vi.advanceTimersByTime(3000)
  expect(FakeAudioContext.started.length).toBe(played)
})

test('the melody does not start when music is off, and stops when it is switched off', () => {
  vi.useFakeTimers()
  settingsStore.setState({ music: false })
  music.start()
  vi.advanceTimersByTime(2000)
  expect(FakeAudioContext.started).toHaveLength(0)
  settingsStore.setState({ music: true })
  music.start()
  vi.advanceTimersByTime(1000)
  expect(music.playing()).toBe(true)
  settingsStore.setState({ music: false })
  expect(music.playing()).toBe(false)
})
