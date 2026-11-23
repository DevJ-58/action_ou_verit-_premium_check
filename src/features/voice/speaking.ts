import { useEffect, useState } from 'react'
import { audioContext } from '@/lib/audio/context'

/** Loudness above which someone is considered to be talking (0 … 1). */
export const SPEAKING_LEVEL = 0.04

/** RMS loudness of 8-bit time-domain samples (128 = silence), 0 … 1. */
export function levelOf(samples: Uint8Array): number {
  let sum = 0
  for (const s of samples) {
    const v = (s - 128) / 128
    sum += v * v
  }
  return Math.sqrt(sum / samples.length)
}

/** Ids of the voices currently talking, among the given streams (checked 8 times a second). */
export function useSpeaking(streams: ReadonlyMap<string, MediaStream>): ReadonlySet<string> {
  const [speaking, setSpeaking] = useState<ReadonlySet<string>>(new Set())
  useEffect(() => {
    const ctx = audioContext()
    if (!ctx || streams.size === 0) return
    const meters = [...streams].map(([id, stream]) => {
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      return { id, source, analyser, data: new Uint8Array(analyser.fftSize), quietSince: 0 }
    })
    const id = setInterval(() => {
      const now = Date.now()
      const next = new Set<string>()
      for (const m of meters) {
        m.analyser.getByteTimeDomainData(m.data)
        if (levelOf(m.data) > SPEAKING_LEVEL) m.quietSince = now + 350
        if (m.quietSince > now) next.add(m.id)
      }
      setSpeaking((prev) =>
        prev.size === next.size && [...next].every((x) => prev.has(x)) ? prev : next,
      )
    }, 125)
    return () => {
      clearInterval(id)
      meters.forEach((m) => m.source.disconnect())
      setSpeaking(new Set())
    }
  }, [streams])
  return speaking
}
