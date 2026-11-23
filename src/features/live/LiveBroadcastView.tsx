import { useEffect, useRef, useState } from 'react'
import { SwitchCamera, VideoOff } from 'lucide-react'
import { Button, IconButton } from '@/design-system'
import type { Live } from '@/features/room/types'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'
import { getSignalTransport } from './getSignalTransport'
import { LiveBadge } from './LiveBadge'
import { createBroadcaster, type Broadcaster } from './session'
import { useCamera, type Facing } from './useCamera'
import { useLiveCountdown } from './useLiveCountdown'

export interface LiveBroadcastViewProps {
  code: string
  selfId: string
  live: Live
  onStop(): void
}

/** The phone filming: its own preview, the time left, switch camera, stop. */
export function LiveBroadcastView({ code, selfId, live, onStop }: LiveBroadcastViewProps) {
  const t = useT()
  const [facing, setFacing] = useState<Facing>('user')
  const camera = useCamera(facing)
  const seconds = useLiveCountdown(live)
  const video = useRef<HTMLVideoElement>(null)
  const broadcaster = useRef<Broadcaster | null>(null)
  const stream = camera.status === 'on' ? camera.stream : null

  useEffect(() => {
    if (!stream) return
    if (video.current) video.current.srcObject = stream
    if (broadcaster.current) return broadcaster.current.replaceStream(stream)
    broadcaster.current = createBroadcaster({
      code,
      selfId,
      stream,
      transport: getSignalTransport(),
    })
  }, [stream, code, selfId])

  useEffect(
    () => () => {
      broadcaster.current?.stop()
      broadcaster.current = null
    },
    [],
  )

  if (camera.status === 'denied' || camera.status === 'unavailable') {
    return (
      <div className="flex w-full max-w-sm flex-col gap-3 rounded-[22px] border border-dare p-4">
        <p role="alert" className="flex items-center gap-2 font-semibold">
          <VideoOff aria-hidden="true" size={18} className="text-dare" />
          {camera.status === 'denied' ? t.live.cameraDenied : t.live.cameraUnavailable}
        </p>
        <Button variant="ghost" onClick={onStop}>
          {t.live.stop}
        </Button>
      </div>
    )
  }

  return (
    <section aria-label={t.live.filming} className="flex w-full max-w-sm flex-col gap-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] border-[1.5px] border-dare bg-ink">
        <video
          ref={video}
          autoPlay
          muted
          playsInline
          className={cn('size-full object-cover', facing === 'user' && '-scale-x-100')}
        />
        <LiveBadge seconds={seconds} />
        <IconButton
          label={t.live.switchCamera}
          icon={<SwitchCamera size={18} />}
          onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
          className="absolute right-3 bottom-3 border-ivory/60 bg-ink/60 text-ivory"
        />
      </div>
      <Button variant="danger" onClick={onStop}>
        <VideoOff aria-hidden="true" size={18} />
        {t.live.stop}
      </Button>
    </section>
  )
}
