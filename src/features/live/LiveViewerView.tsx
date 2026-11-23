import { useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import type { Live } from '@/features/room/types'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { getSignalTransport } from './getSignalTransport'
import { LiveBadge } from './LiveBadge'
import { createViewer, type ViewerState } from './session'
import { useLiveCountdown } from './useLiveCountdown'

export interface LiveViewerViewProps {
  code: string
  selfId: string
  live: Live
  name: string
}

/** Another phone watching the live video of the challenge. */
export function LiveViewerView({ code, selfId, live, name }: LiveViewerViewProps) {
  const t = useT()
  const video = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<ViewerState>('connecting')
  const [muted, setMuted] = useState(false)
  const seconds = useLiveCountdown(live)

  useEffect(() => {
    const viewer = createViewer({
      code,
      selfId,
      by: live.by,
      transport: getSignalTransport(),
      onState: setState,
      onStream: (stream) => {
        const el = video.current
        if (!el) return
        el.srcObject = stream
        // Sound needs a tap on some phones: start muted if the browser refuses.
        el.play().catch(() => {
          el.muted = true
          setMuted(true)
          void el.play().catch(() => {})
        })
      },
    })
    return () => viewer.stop()
  }, [code, selfId, live.by])

  return (
    <section aria-label={format(t.live.watching, { name })} className="w-full max-w-sm">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] border-[1.5px] border-dare bg-ink">
        <video ref={video} autoPlay playsInline className="size-full object-cover">
          <track kind="captions" />
        </video>
        <LiveBadge seconds={seconds} />
        {state !== 'connected' ? (
          <p
            role="status"
            className="absolute inset-x-4 bottom-4 rounded-[16px] bg-ink/80 p-3 text-center text-sm font-semibold text-ivory"
          >
            {format(state === 'failed' ? t.live.failed : t.live.connecting, { name })}
          </p>
        ) : null}
        {muted ? (
          <button
            type="button"
            onClick={() => {
              if (video.current) video.current.muted = false
              setMuted(false)
            }}
            className="absolute right-3 bottom-3 flex min-h-11 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-extrabold text-on-gold"
          >
            <Volume2 aria-hidden="true" size={16} />
            {t.live.sound}
          </button>
        ) : null}
      </div>
    </section>
  )
}
