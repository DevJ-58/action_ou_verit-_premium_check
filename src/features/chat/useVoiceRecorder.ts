import { useCallback, useEffect, useRef, useState } from 'react'
import { VOICE_MAX_MS } from './types'

export type RecorderStatus = 'idle' | 'recording' | 'denied' | 'unsupported'
export interface VoiceNote {
  blob: Blob
  ms: number
}

// Chrome/Android/Firefox record WebM-Opus; Safari/iOS records MP4-AAC.
const TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']

interface Session {
  recorder: MediaRecorder
  stream: MediaStream
  chunks: Blob[]
  startedAt: number
  tick: ReturnType<typeof setInterval>
  limit: ReturnType<typeof setTimeout>
}

/** Records a voice note of up to 30 seconds with the microphone. */
export function useVoiceRecorder(options: { onAutoStop?(note: VoiceNote): void } = {}) {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [seconds, setSeconds] = useState(0)
  const session = useRef<Session | null>(null)
  const onAutoStop = useRef(options.onAutoStop)
  useEffect(() => {
    onAutoStop.current = options.onAutoStop
  })

  const finish = useCallback((keep: boolean): Promise<VoiceNote | null> => {
    const s = session.current
    if (!s) return Promise.resolve(null)
    session.current = null
    clearInterval(s.tick)
    clearTimeout(s.limit)
    const ms = Math.min(Date.now() - s.startedAt, VOICE_MAX_MS)
    return new Promise((resolve) => {
      s.recorder.onstop = () => {
        s.stream.getTracks().forEach((t) => t.stop())
        setStatus('idle')
        setSeconds(0)
        const blob = new Blob(s.chunks, { type: s.recorder.mimeType })
        resolve(keep && ms > 300 ? { blob, ms } : null)
      }
      if (s.recorder.state !== 'inactive') s.recorder.stop()
      else s.recorder.onstop?.(new Event('stop'))
    })
  }, [])

  const start = useCallback(async () => {
    if (session.current) return
    const Recorder = globalThis.MediaRecorder
    if (!Recorder || !navigator.mediaDevices?.getUserMedia) return setStatus('unsupported')
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      return setStatus('denied')
    }
    const mimeType = TYPES.find((t) => Recorder.isTypeSupported?.(t)) ?? ''
    const recorder = new Recorder(stream, mimeType ? { mimeType } : undefined)
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    const startedAt = Date.now()
    session.current = {
      recorder,
      stream,
      chunks,
      startedAt,
      tick: setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 250),
      limit: setTimeout(() => {
        void finish(true).then((note) => note && onAutoStop.current?.(note))
      }, VOICE_MAX_MS),
    }
    recorder.start()
    setSeconds(0)
    setStatus('recording')
  }, [finish])

  useEffect(() => () => void finish(false), [finish])

  return {
    status,
    seconds,
    start,
    stop: () => finish(true),
    cancel: () => void finish(false),
  }
}
