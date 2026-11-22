import { useId, useState, type FormEvent } from 'react'
import { Bookmark, Send, Sparkles } from 'lucide-react'
import { Button, Emoji } from '@/design-system'
import { systemDares } from '@/content/systemDares'
import {
  drawDare,
  isAllowedFor,
  validateWrittenDare,
  WRITTEN_DARE_MAX,
  type Dare,
  type GameState,
  type Turn,
} from '@/engine'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'

export interface ProposalComposerProps {
  game: GameState
  turn: Turn
  selfId: string
  ownDares: Dare[]
  onPropose(dare: Dare): void
}

/** A player writes (or picks, or gets inspired) the dare they give to the answerer. */
export function ProposalComposer({
  game,
  turn,
  selfId,
  ownDares,
  onPropose,
}: ProposalComposerProps) {
  const t = useT()
  const id = useId()
  const answerer = game.players.find((p) => p.id === turn.answererId)!
  const kind = turn.kind!
  const filter = {
    kind,
    mode: game.settings.mode,
    categories: game.settings.categories,
    limits: answerer.limits,
  }
  const mine = ownDares.filter((d) => isAllowedFor(d, filter))
  const sent = turn.proposals?.find((p) => p.playerId === selfId)
  const [text, setText] = useState(sent?.dare.text ?? '')
  const [error, setError] = useState<string | null>(null)

  function submit(event: FormEvent) {
    event.preventDefault()
    const result = validateWrittenDare(text)
    if (!result.ok) return setError(t.dareForm.errors[result.reason])
    onPropose({
      id: 'proposal',
      kind,
      category: game.settings.categories[0]!,
      intensity: 1,
      modes: [game.settings.mode],
      text: result.text,
    })
  }

  function inspire() {
    const dare = drawDare(
      systemDares,
      { ...filter, usedIds: new Set(game.usedDareIds) },
      Math.random,
    )
    if (dare) setText(dare.text)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <h2 className="font-display text-[34px] leading-none">
        {format(t.roomGame.proposeTitle, { name: answerer.name })}
      </h2>
      <span className="self-start rounded-full bg-seat px-3 py-1.5 text-xs font-extrabold tracking-[0.14em] text-gold-text uppercase">
        {format(t.roomGame.proposeKind, {
          kind: kind === 'truth' ? t.game.truth : t.game.dare,
          name: answerer.name,
        })}
      </span>
      <label htmlFor={id} className="text-sm font-semibold text-muted">
        {format(t.game.writeLabel, { name: answerer.name })}
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
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" className="normal-case tracking-normal" onClick={inspire}>
          <Sparkles aria-hidden="true" size={18} />
          {t.roomGame.inspire}
        </Button>
        {mine.map((dare) => (
          <button
            key={dare.id}
            type="button"
            onClick={() => setText(dare.text)}
            className="flex min-h-11 max-w-full items-center gap-2 rounded-full border border-line px-4 text-left text-sm font-semibold"
          >
            <Bookmark aria-hidden="true" size={14} className="shrink-0 text-gold-text" />
            <span className="truncate">{dare.text}</span>
          </button>
        ))}
      </div>
      <Button type="submit" size="lg">
        <Send aria-hidden="true" size={18} />
        {sent ? t.roomGame.update : t.roomGame.propose}
      </Button>
      {sent ? (
        <p role="status" className="flex items-center gap-2 font-semibold text-gold-text">
          <Emoji name="raisedHands" size={22} />
          {t.roomGame.proposed}
        </p>
      ) : null}
    </form>
  )
}
