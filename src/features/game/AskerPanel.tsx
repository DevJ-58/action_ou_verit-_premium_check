import { useState } from 'react'
import { Bookmark, Dices, PenLine } from 'lucide-react'
import { Avatar, Button, Sheet } from '@/design-system'
import { isAllowedFor, type GameAction, type GameState, type Turn } from '@/engine'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { AskerOption } from './AskerOption'
import { WrittenDareForm } from './WrittenDareForm'

export interface AskerPanelProps {
  game: GameState
  turn: Turn
  dispatch(action: GameAction): void
}

/** The asking player chooses where the dare comes from. */
export function AskerPanel({ game, turn, dispatch }: AskerPanelProps) {
  const t = useT()
  const [writing, setWriting] = useState(false)
  const [picking, setPicking] = useState(false)
  const asker = game.players.find((p) => p.id === turn.askerId)!
  const answerer = game.players.find((p) => p.id === turn.answererId)!
  const { source, mode, categories } = game.settings
  const kind = turn.kind!
  const own = asker.customDares.filter((d) =>
    isAllowedFor(d, { kind, mode, categories, limits: answerer.limits }),
  )
  const canWrite = source !== 'system' || turn.noDareAvailable

  return (
    <div className="flex flex-col gap-6">
      <span className="self-start rounded-full bg-seat px-3 py-1.5 text-xs font-extrabold tracking-[0.14em] text-gold-text uppercase">
        {format(t.game.kindFor, {
          kind: kind === 'truth' ? t.game.truth : t.game.dare,
          name: answerer.name,
        })}
      </span>
      <div>
        <div className="flex items-center gap-3">
          <Avatar name={asker.name} highlight="asker" size="sm" />
          <span className="text-[15px] font-semibold text-muted">
            {format(t.game.askerIsYou, { name: asker.name })}
          </span>
        </div>
        <h1 className="mt-4 font-display text-[44px] leading-[0.95]">
          {format(t.game.askTitle, { name: answerer.name })}
        </h1>
      </div>

      {turn.noDareAvailable ? (
        <div role="status" className="rounded-2xl border-[1.5px] border-dare p-4">
          <p className="font-bold">{t.game.noDare}</p>
          <p className="mt-1 text-sm text-muted">{t.game.noDareHint}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {source !== 'custom' && !turn.noDareAvailable ? (
          <AskerOption
            icon={<Dices size={24} />}
            title={t.game.systemDare}
            hint={t.game.systemDareHint}
            onClick={() => dispatch({ type: 'PICK_SYSTEM' })}
          />
        ) : null}
        {source !== 'system' && own.length > 0 ? (
          <AskerOption
            icon={<Bookmark size={24} />}
            title={t.game.myDares}
            hint={format(t.game.myDaresHint, { count: own.length })}
            onClick={() => setPicking(true)}
          />
        ) : null}
        {canWrite && !writing ? (
          <AskerOption
            icon={<PenLine size={24} />}
            title={t.game.writeNow}
            onClick={() => setWriting(true)}
          />
        ) : null}
        {writing ? (
          <WrittenDareForm
            answerer={answerer.name}
            onSubmit={(text) => dispatch({ type: 'PICK_WRITTEN', text })}
          />
        ) : null}
        {turn.noDareAvailable ? (
          <Button variant="ghost" onClick={() => dispatch({ type: 'SKIP' })}>
            {t.game.skipFree}
          </Button>
        ) : null}
      </div>

      <Sheet open={picking} onClose={() => setPicking(false)} title={t.game.myDares}>
        <ul className="flex max-h-[60dvh] flex-col gap-2 overflow-y-auto">
          {own.map((dare) => (
            <li key={dare.id}>
              <button
                type="button"
                className="w-full rounded-xl border border-line p-4 text-left font-semibold"
                onClick={() => dispatch({ type: 'PICK_CUSTOM', dareId: dare.id })}
              >
                {dare.text}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  )
}
