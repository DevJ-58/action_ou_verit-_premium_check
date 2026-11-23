import { useEffect, useRef, useState } from 'react'
import { useT } from '@/i18n/useT'
import { codeFromScan } from './scanCode'

export interface QrScannerProps {
  onCode(code: string): void
}

type Reader = (video: HTMLVideoElement) => Promise<string | null>

interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>
}

/** Built-in detector when the browser has one (Chrome, Android); else jsQR, loaded on demand. */
async function makeReader(): Promise<Reader> {
  const Native = (
    globalThis as {
      BarcodeDetector?: { new (o: object): Detector; getSupportedFormats(): Promise<string[]> }
    }
  ).BarcodeDetector
  if (Native && (await Native.getSupportedFormats()).includes('qr_code')) {
    const detector = new Native({ formats: ['qr_code'] })
    return async (video) => (await detector.detect(video))[0]?.rawValue ?? null
  }
  const { default: jsQR } = await import('jsqr')
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  return async (video) => {
    if (!ctx || !video.videoWidth) return null
    const scale = Math.min(1, 640 / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return jsQR(image.data, image.width, image.height)?.data ?? null
  }
}

/** Live camera view that reads a room QR code. */
export function QrScanner({ onCode }: QrScannerProps) {
  const t = useT()
  const video = useRef<HTMLVideoElement>(null)
  const done = useRef(onCode)
  const [problem, setProblem] = useState<'denied' | 'unsupported' | null>(null)
  const [notRoom, setNotRoom] = useState(false)

  useEffect(() => {
    done.current = onCode
  })

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let stopped = false
    const release = () => stream?.getTracks().forEach((track) => track.stop())

    void (async () => {
      if (!navigator.mediaDevices?.getUserMedia) return setProblem('unsupported')
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
      } catch {
        return setProblem('denied')
      }
      if (stopped) return release()
      const el = video.current!
      el.srcObject = stream
      await el.play().catch(() => {})
      const read = await makeReader().catch(() => null)
      if (!read) return setProblem('unsupported')
      const tick = async () => {
        if (stopped) return
        const text = el.readyState >= 2 ? await read(el).catch(() => null) : null
        if (stopped) return
        const code = text ? codeFromScan(text) : null
        if (code) {
          stopped = true
          release()
          return done.current(code)
        }
        if (text) setNotRoom(true)
        timer = setTimeout(() => void tick(), 180)
      }
      void tick()
    })()

    return () => {
      stopped = true
      clearTimeout(timer)
      release()
    }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-[28px] bg-ink">
        <video ref={video} muted playsInline className="size-full object-cover" />
        <div
          aria-hidden="true"
          className="absolute inset-[16%] rounded-[24px] border-[3px] border-gold motion-safe:animate-pulse"
        />
      </div>
      {problem ? (
        <p role="alert" className="font-semibold text-dare">
          {problem === 'denied' ? t.room.scanDenied : t.room.scanUnsupported}
        </p>
      ) : (
        <p className="text-sm text-muted">{notRoom ? t.room.scanNotRoom : t.room.scanHint}</p>
      )}
    </div>
  )
}
