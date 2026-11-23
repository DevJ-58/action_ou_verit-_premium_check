import { act, renderHook } from '@testing-library/react'
import { useVoiceRecorder } from './useVoiceRecorder'

class FakeRecorder {
  static isTypeSupported = (type: string) => type.startsWith('audio/webm')
  state = 'inactive'
  mimeType: string
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  constructor(_stream: unknown, options: { mimeType: string }) {
    this.mimeType = options.mimeType
  }
  start() {
    this.state = 'recording'
  }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['voice'], { type: this.mimeType }) })
    this.onstop?.()
  }
}

const track = { stop: vi.fn() }
function install(getUserMedia: () => Promise<unknown>) {
  vi.stubGlobal('MediaRecorder', FakeRecorder)
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia },
    configurable: true,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

test('records a voice note and gives back the audio and its duration', async () => {
  vi.useFakeTimers()
  install(async () => ({ getTracks: () => [track] }))
  const { result } = renderHook(() => useVoiceRecorder())
  await act(() => result.current.start())
  expect(result.current.status).toBe('recording')
  await act(async () => vi.advanceTimersByTime(4000))
  expect(result.current.seconds).toBe(4)
  let note: Awaited<ReturnType<typeof result.current.stop>> = null
  await act(async () => {
    note = await result.current.stop()
  })
  expect(note!.blob.type).toMatch(/^audio\/webm/)
  expect(note!.ms).toBeGreaterThanOrEqual(4000)
  expect(track.stop).toHaveBeenCalled()
  expect(result.current.status).toBe('idle')
})

test('stops by itself after 30 seconds and hands the note over', async () => {
  vi.useFakeTimers()
  install(async () => ({ getTracks: () => [track] }))
  const onAutoStop = vi.fn()
  const { result } = renderHook(() => useVoiceRecorder({ onAutoStop }))
  await act(() => result.current.start())
  await act(async () => vi.advanceTimersByTime(30_500))
  expect(onAutoStop).toHaveBeenCalledWith(expect.objectContaining({ ms: 30_000 }))
  expect(result.current.status).toBe('idle')
})

test('a refused microphone is reported', async () => {
  install(async () => {
    throw new DOMException('no', 'NotAllowedError')
  })
  const { result } = renderHook(() => useVoiceRecorder())
  await act(() => result.current.start())
  expect(result.current.status).toBe('denied')
})

test('cancel discards the recording', async () => {
  install(async () => ({ getTracks: () => [track] }))
  const { result } = renderHook(() => useVoiceRecorder())
  await act(() => result.current.start())
  act(() => result.current.cancel())
  expect(result.current.status).toBe('idle')
})
