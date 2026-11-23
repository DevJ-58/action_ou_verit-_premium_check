import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface VoicePlayerProps {
  path: string
  ms: number
  label: string
  resolve(path: string): Promise<string>
  tone?: 'gold' | 'plain'
}

/** Plays a voice note; the address is resolved (signed) on first play. */
export function VoicePlayer({ path, ms, label, resolve, tone = 'plain' }: VoicePlayerProps) {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const seconds = Math.max(1, Math.round(ms / 1000))

  useEffect(() => () => audio.current?.pause(), [])

  async function toggle() {
    if (playing) {
      audio.current?.pause()
      return
    }
    try {
      if (!audio.current) {
        const el = new Audio(await resolve(path))
        el.onplay = () => setPlaying(true)
        el.onpause = () => setPlaying(false)
        el.onended = () => {
          setPlaying(false)
          setProgress(0)
        }
        el.ontimeupdate = () => setProgress(Math.min(1, (el.currentTime * 1000) / ms))
        audio.current = el
      }
      await audio.current.play()
    } catch {
      setPlaying(false)
    }
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={playing}
      onClick={() => void toggle()}
      className="flex min-h-11 w-full min-w-44 items-center gap-3 text-left"
    >
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-full',
          tone === 'gold' ? 'bg-on-gold text-gold' : 'bg-gold text-on-gold',
        )}
      >
        {playing ? <Pause aria-hidden="true" size={18} /> : <Play aria-hidden="true" size={18} />}
      </span>
      <span
        aria-hidden="true"
        className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-current/20"
      >
        <span
          className="absolute inset-y-0 left-0 bg-current"
          style={{ width: `${progress * 100}%` }}
        />
      </span>
      <span className="text-xs font-bold tabular-nums">0:{String(seconds).padStart(2, '0')}</span>
    </button>
  )
}
