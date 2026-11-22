import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/design-system'
import { validateWrittenDare, WRITTEN_DARE_MAX } from '@/engine'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'

export interface WrittenDareFormProps {
  answerer: string
  onSubmit(text: string): void
}

/** The asker types a dare on the spot. */
export function WrittenDareForm({ answerer, onSubmit }: WrittenDareFormProps) {
  const t = useT()
  const id = useId()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(event: FormEvent) {
    event.preventDefault()
    const result = validateWrittenDare(text)
    if (!result.ok) return setError(t.dareForm.errors[result.reason])
    onSubmit(result.text)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <label htmlFor={id} className="text-[13px] font-semibold text-muted">
        {format(t.game.writeLabel, { name: answerer })}
      </label>
      <textarea
        id={id}
        rows={3}
        value={text}
        maxLength={WRITTEN_DARE_MAX}
        aria-invalid={error ? true : undefined}
        onChange={(e) => {
          setText(e.target.value)
          setError(null)
        }}
        className="resize-none rounded-2xl border-[1.5px] border-line bg-transparent p-3.5 text-base leading-relaxed"
      />
      {error ? <p className="text-sm font-semibold text-dare">{error}</p> : null}
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-muted tabular-nums">
          {text.length} / {WRITTEN_DARE_MAX}
        </span>
        <Button type="submit" variant="primary">
          {format(t.game.send, { name: answerer })}
        </Button>
      </div>
    </form>
  )
}
