import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/design-system'
import { ANSWER_MAX, type ChallengeKind } from '@/engine'
import { VoiceRecorderBar } from '@/features/chat/VoiceRecorderBar'
import type { VoiceNote } from '@/features/chat/useVoiceRecorder'
import { useT } from '@/i18n/useT'

export interface AnswerFormProps {
  kind: ChallengeKind
  answered: boolean
  onAnswer(text: string): void
  onVoice(note: VoiceNote): void
  voiceLocked?: boolean
}

/** The designated player answers the truth, or tells how the dare went. */
export function AnswerForm({
  kind,
  answered,
  onAnswer,
  onVoice,
  voiceLocked = false,
}: AnswerFormProps) {
  const t = useT()
  const id = useId()
  const [text, setText] = useState('')
  const [error, setError] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    const value = text.trim()
    if (!value || value.length > ANSWER_MAX) return setError(true)
    onAnswer(value)
    setText('')
  }

  return (
    <form onSubmit={submit} noValidate className="flex w-full flex-col gap-2.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-muted">
        {kind === 'truth' ? t.roomGame.answerTruth : t.roomGame.answerDare}
      </label>
      <textarea
        id={id}
        rows={3}
        value={text}
        maxLength={ANSWER_MAX}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => {
          setText(e.target.value)
          setError(false)
        }}
        className="resize-none rounded-[18px] border-[1.5px] border-line bg-transparent p-4 text-base text-text placeholder:text-muted/70"
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm font-semibold text-dare">
          {t.roomGame.answerError}
        </p>
      ) : null}
      <VoiceRecorderBar onNote={onVoice} locked={voiceLocked}>
        <Button type="submit" variant={kind === 'truth' ? 'truth' : 'dare'} className="flex-1">
          {answered ? t.roomGame.updateAnswer : t.roomGame.sendAnswer}
        </Button>
      </VoiceRecorderBar>
    </form>
  )
}
