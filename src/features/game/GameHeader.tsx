import { useState } from 'react'
import { Volume2, VolumeX, X } from 'lucide-react'
import { Button, IconButton, Sheet } from '@/design-system'
import { settingsStore, useSettings } from '@/features/settings/settingsStore'
import { useT } from '@/i18n/useT'

export interface GameHeaderProps {
  round: number
  rounds: number
  onQuit(): void
}

export function GameHeader({ round, rounds, onQuit }: GameHeaderProps) {
  const t = useT()
  const sound = useSettings((s) => s.sound)
  const [confirming, setConfirming] = useState(false)
  return (
    <header className="flex items-center justify-between pt-2">
      <IconButton label={t.game.quit} icon={<X size={18} />} onClick={() => setConfirming(true)} />
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="size-1.75 rotate-45 bg-gold" />
        <span className="text-xs font-extrabold tracking-[0.16em] text-muted uppercase">
          {t.game.round}
        </span>
        <span className="text-lg font-extrabold tabular-nums">
          {round}
          <span className="font-semibold text-muted"> / {rounds}</span>
        </span>
        <span aria-hidden="true" className="size-1.75 rotate-45 bg-gold" />
      </div>
      <IconButton
        label={sound ? t.game.soundOn : t.game.soundOff}
        icon={sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        onClick={() => settingsStore.getState().setSound(!sound)}
      />
      <Sheet open={confirming} onClose={() => setConfirming(false)} title={t.game.quitConfirm}>
        <p className="mb-5 text-muted">{t.game.quitHint}</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setConfirming(false)}>
            {t.game.keepPlaying}
          </Button>
          <Button variant="danger" className="flex-1" onClick={onQuit}>
            {t.game.quit}
          </Button>
        </div>
      </Sheet>
    </header>
  )
}
