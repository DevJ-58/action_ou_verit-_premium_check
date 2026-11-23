import { render, screen, waitFor } from '@testing-library/react'
import { QrScanner } from './QrScanner'

const stop = vi.fn()
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  Object.defineProperty(HTMLMediaElement.prototype, 'readyState', { value: 4, configurable: true })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function camera(result: 'ok' | 'denied') {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: async () => {
        if (result === 'denied') throw new DOMException('no', 'NotAllowedError')
        return { getTracks: () => [{ stop }] }
      },
    },
  })
}

test('a scanned invitation link gives its room code, and the camera is released', async () => {
  camera('ok')
  vi.stubGlobal(
    'BarcodeDetector',
    class {
      static getSupportedFormats = async () => ['qr_code']
      detect = async () => [{ rawValue: 'https://app.example/salon/9WPVT7' }]
    },
  )
  const onCode = vi.fn()
  const { unmount } = render(<QrScanner onCode={onCode} />)
  await waitFor(() => expect(onCode).toHaveBeenCalledWith('9WPVT7'))
  unmount()
  expect(stop).toHaveBeenCalled()
})

test('a QR code that is not a room is pointed out', async () => {
  camera('ok')
  vi.stubGlobal(
    'BarcodeDetector',
    class {
      static getSupportedFormats = async () => ['qr_code']
      detect = async () => [{ rawValue: 'https://restaurant.example/menu' }]
    },
  )
  const onCode = vi.fn()
  render(<QrScanner onCode={onCode} />)
  expect(await screen.findByText(/ce qr code n’est pas un salon/i)).toBeInTheDocument()
  expect(onCode).not.toHaveBeenCalled()
})

test('a refused camera explains what to do', async () => {
  camera('denied')
  render(<QrScanner onCode={vi.fn()} />)
  expect(await screen.findByRole('alert')).toHaveTextContent(/autorise la caméra/i)
})
