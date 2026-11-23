import { useEffect, useRef } from 'react'

/** Plays one remote voice (hidden). */
export function VoiceSpeaker({ stream }: { stream: MediaStream }) {
  const audio = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    const el = audio.current
    if (!el) return
    el.srcObject = stream
    void el.play().catch(() => {})
  }, [stream])
  return (
    <audio ref={audio} autoPlay data-voice-speaker>
      <track kind="captions" />
    </audio>
  )
}
