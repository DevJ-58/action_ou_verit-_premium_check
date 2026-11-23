import { useId, useState, type FormEvent } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Button } from '@/design-system'
import { systemDares } from '@/content/systemDares'
import { drawDare, validateWrittenDare, WRITTEN_DARE_MAX, type DrawFilter } from '@/engine'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'

export interface WriteProposalProps {
  answerer: string
  filter: DrawFilter
  initial: string
  sent: boolean
  onSubmit(text: string): void
}

/** Write the dare on the spot, or get a game dare to start from. */
export function WriteProposal({ answerer, filter, initial, sent, onSubmit }: WriteProposalProps) {
  const t = useT()
  const id = useId()
  const [text, setText] = useState(initial)
  const [error, setError] = useState<string | null>(null)

  function submit(event: FormEvent) {
    event.preventDefault()
    const result = validateWrittenDare(text)
    if (!result.ok) return setError(t.dareForm.errors[result.reason])
    onSubmit(result.text)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <label htmlFor={id} className="text-sm font-semibold text-muted">
        {format(t.game.writeLabel, { name: answerer })}
      </label>
      <textarea
        id={id}
        rows={4}
        value={text}
        maxLength={WRITTEN_DARE_MAX}
        onChange={(e) => {
          setText(e.target.value)
          setError(null)
        }}
        className="resize-none rounded-[24px] border-[1.5px] border-line bg-transparent p-4 text-lg leading-relaxed"
      />
      {error ? <p className="text-sm font-semibold text-dare">{error}</p> : null}
      <Button
        variant="ghost"
        className="self-start normal-case tracking-normal"
        onClick={() => {
          const dare = drawDare(systemDares, filter, Math.random)
          if (dare) setText(dare.text)
        }}
      >
        <Sparkles aria-hidden="true" size={18} />
        {t.roomGame.inspire}
      </Button>
      <Button type="submit" size="lg">
        <Send aria-hidden="true" size={18} />
        {sent ? t.roomGame.update : t.roomGame.propose}
      </Button>
    </form>
  )
}
