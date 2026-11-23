import { Send, Trash2 } from 'lucide-react'
import { IconButton } from '@/design-system'
import { useT } from '@/i18n/useT'
import { VOICE_MAX_MS } from './types'

export interface RecordingBarProps {
  seconds: number
  onCancel(): void
  onSend(): void
}

/** While a voice note records: cancel, the timer, send. */
export function RecordingBar({ seconds, onCancel, onSend }: RecordingBarProps) {
  const t = useT()
  return (
    <div role="group" aria-label={t.chat.recording} className="flex w-full items-center gap-2">
      <IconButton label={t.chat.cancel} icon={<Trash2 size={18} />} onClick={onCancel} />
      <span
        className="flex min-h-12 flex-1 items-center gap-2 rounded-full bg-seat px-4 font-bold"
        aria-live="polite"
      >
        <span className="size-2.5 rounded-full bg-dare motion-safe:animate-pulse" />
        0:{String(seconds).padStart(2, '0')}
        <span className="ml-auto text-sm font-semibold text-muted">
          {VOICE_MAX_MS / 1000 - seconds} s
        </span>
      </span>
      <IconButton
        label={t.chat.stopSend}
        icon={<Send size={18} />}
        className="border-gold bg-gold text-on-gold"
        onClick={onSend}
      />
    </div>
  )
}
