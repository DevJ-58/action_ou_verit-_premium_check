import { Mic, Send, Trash2 } from 'lucide-react'
import { IconButton } from '@/design-system'
import { useT } from '@/i18n/useT'
import { VOICE_MAX_MS } from './types'
import { useVoiceRecorder, type VoiceNote } from './useVoiceRecorder'

export interface VoiceRecorderBarProps {
  onNote(note: VoiceNote): void
  /** Shown instead of the mic while not recording (e.g. the text field). */
  children?: React.ReactNode
}

/** Mic button; while recording, a timer with send and cancel. */
export function VoiceRecorderBar({ onNote, children }: VoiceRecorderBarProps) {
  const t = useT()
  const recorder = useVoiceRecorder({ onAutoStop: onNote })
  const left = VOICE_MAX_MS / 1000 - recorder.seconds

  if (recorder.status === 'recording') {
    return (
      <div className="flex w-full items-center gap-2" role="group" aria-label={t.chat.recording}>
        <IconButton label={t.chat.cancel} icon={<Trash2 size={18} />} onClick={recorder.cancel} />
        <span className="flex flex-1 items-center gap-2 font-bold" aria-live="polite">
          <span className="size-2.5 rounded-full bg-dare motion-safe:animate-pulse" />
          0:{String(recorder.seconds).padStart(2, '0')}
          <span className="text-sm font-semibold text-muted">· {left} s</span>
        </span>
        <IconButton
          label={t.chat.stopSend}
          icon={<Send size={18} />}
          className="border-gold bg-gold text-on-gold"
          onClick={() => void recorder.stop().then((note) => note && onNote(note))}
        />
      </div>
    )
  }
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex w-full items-center gap-2">
        {children}
        <IconButton
          label={t.chat.record}
          icon={<Mic size={18} />}
          onClick={() => void recorder.start()}
        />
      </div>
      {recorder.status === 'denied' || recorder.status === 'unsupported' ? (
        <p role="alert" className="text-sm font-semibold text-dare">
          {recorder.status === 'denied' ? t.chat.denied : t.chat.unsupported}
        </p>
      ) : null}
    </div>
  )
}
