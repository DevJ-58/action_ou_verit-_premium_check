import { useState } from 'react'
import { Emoji, Segmented } from '@/design-system'
import { isAllowedFor, type CategoryId, type Dare, type GameState, type Turn } from '@/engine'
import { SystemDareBrowser } from '@/features/dares/SystemDareBrowser'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { OwnDarePicker } from './OwnDarePicker'
import { WriteProposal } from './WriteProposal'

export interface ProposalComposerProps {
  game: GameState
  turn: Turn
  selfId: string
  ownDares: Dare[]
  onPropose(dare: Dare): void
}

type Source = 'mine' | 'game' | 'write'

/** A player gives the answerer a dare: one of theirs, one of the game's, or written now. */
export function ProposalComposer({
  game,
  turn,
  selfId,
  ownDares,
  onPropose,
}: ProposalComposerProps) {
  const t = useT()
  const answerer = game.players.find((p) => p.id === turn.answererId)!
  const kind = turn.kind!
  const filter = {
    kind,
    mode: game.settings.mode,
    categories: game.settings.categories,
    limits: answerer.limits,
  }
  const mine = ownDares.filter((d) => isAllowedFor(d, filter))
  const categories: CategoryId[] = game.settings.categories.filter(
    (c) => !answerer.limits.excludedCategories.includes(c),
  )
  const sent = turn.proposals?.find((p) => p.playerId === selfId)
  const [source, setSource] = useState<Source>(mine.length > 0 ? 'mine' : 'write')

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-[34px] leading-none">
        {format(t.roomGame.proposeTitle, { name: answerer.name })}
      </h2>
      <span className="self-start rounded-full bg-seat px-3 py-1.5 text-xs font-extrabold tracking-[0.14em] text-gold-text uppercase">
        {format(t.roomGame.proposeKind, {
          kind: kind === 'truth' ? t.game.truth : t.game.dare,
          name: answerer.name,
        })}
      </span>
      <Segmented<Source>
        label={t.roomGame.source}
        value={source}
        options={[
          { value: 'mine', label: `${t.roomGame.myDares} · ${mine.length}` },
          { value: 'game', label: t.roomGame.gameDares },
          { value: 'write', label: t.roomGame.write },
        ]}
        onChange={setSource}
      />
      {source === 'mine' ? (
        <OwnDarePicker dares={mine} sentText={sent?.dare.text} onPick={onPropose} />
      ) : null}
      {source === 'game' ? (
        <SystemDareBrowser
          kind={kind}
          categories={categories}
          accept={(dare) => isAllowedFor(dare, filter)}
          isTaken={(dare) => dare.text === sent?.dare.text}
          takenLabel={t.roomGame.chosen}
          verb={t.myDares.choose}
          onPick={onPropose}
        />
      ) : null}
      {source === 'write' ? (
        <WriteProposal
          answerer={answerer.name}
          filter={{ ...filter, usedIds: new Set(game.usedDareIds) }}
          initial={sent?.dare.text ?? ''}
          sent={Boolean(sent)}
          onSubmit={(text) =>
            onPropose({
              id: 'proposal',
              kind,
              category: categories[0] ?? game.settings.categories[0]!,
              intensity: 1,
              modes: [game.settings.mode],
              text,
            })
          }
        />
      ) : null}
      {sent ? (
        <p role="status" className="flex items-center gap-2 font-semibold text-gold-text">
          <Emoji name="raisedHands" size={22} />
          {t.roomGame.proposed}
        </p>
      ) : null}
    </div>
  )
}
