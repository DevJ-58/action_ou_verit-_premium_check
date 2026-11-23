import { Button, Emoji } from '@/design-system'
import { pointsFor, skipsLeft, type GameState } from '@/engine'
import { ChallengeCard } from '@/features/game/ChallengeCard'
import { CountdownRing } from '@/features/game/CountdownRing'
import { KindChooser } from '@/features/game/KindChooser'
import { WrittenDareForm } from '@/features/game/WrittenDareForm'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import type { RoomStoreState } from '../roomStore'
import { FaceDownCards } from './FaceDownCards'
import { ProposalComposer } from './ProposalComposer'

export interface TurnStageProps {
  state: RoomStoreState
  game: GameState
}

/** What this phone shows for the current step of the turn, depending on its player's role. */
export function TurnStage({ state, game }: TurnStageProps) {
  const t = useT()
  const turn = game.turn
  const selfId = state.self.id
  const nameOf = (id: string) => game.players.find((p) => p.id === id)?.name ?? ''
  if (!turn) return null
  const isAnswerer = turn.answererId === selfId
  const answererAway = state.role === 'host' && !isAnswerer && !state.online.has(turn.answererId)
  const skipAway = answererAway ? (
    <Button
      variant="ghost"
      className="normal-case tracking-normal"
      onClick={() => state.act({ type: 'SKIP' })}
    >
      {format(t.roomGame.skipFor, { name: nameOf(turn.answererId) })}
    </Button>
  ) : null
  const answerer = nameOf(turn.answererId)
  const others = game.players.length - 1
  const waiting = (emoji: 'thinking' | 'eyes' | 'hourglass', text: string) => (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <Emoji name={emoji} size={64} className="motion-safe:animate-bounce" />
      <p className="text-xl font-extrabold">{text}</p>
    </div>
  )

  switch (game.phase) {
    case 'choosing':
      return isAnswerer ? (
        <KindChooser
          answerer={answerer}
          subtitle={t.roomGame.othersWillAsk}
          onChoose={(kind) => state.act({ type: 'CHOOSE_KIND', kind })}
        />
      ) : (
        waiting('thinking', format(t.roomGame.chooses, { name: answerer }))
      )
    case 'proposing':
      return isAnswerer ? (
        <div className="flex flex-col items-center gap-4 text-center">
          {waiting('hourglass', t.roomGame.preparing)}
          <p className="text-3xl font-extrabold tabular-nums">
            {turn.proposals?.length ?? 0} / {others}
          </p>
          <CountdownRing
            key={`${game.round}-${turn.answererId}`}
            seconds={game.settings.proposeSeconds ?? 60}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="self-end">
            <CountdownRing
              key={`${game.round}-${turn.answererId}`}
              seconds={game.settings.proposeSeconds ?? 60}
            />
          </div>
          <ProposalComposer
            game={game}
            turn={turn}
            selfId={selfId}
            ownDares={state.self.customDares}
            onPropose={(dare) => state.act({ type: 'PROPOSE', playerId: selfId, dare })}
          />
        </div>
      )
    case 'picking':
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-display text-[34px] leading-none">
            {isAnswerer ? t.roomGame.pickTitle : format(t.roomGame.picking, { name: answerer })}
          </h2>
          {isAnswerer ? <p className="text-muted">{t.roomGame.pickHint}</p> : null}
          <FaceDownCards
            count={turn.proposals?.length ?? 0}
            faces={isAnswerer ? turn.proposals?.map((p) => p.dare.text) : undefined}
            onPick={isAnswerer ? (index) => state.act({ type: 'PICK_PROPOSAL', index }) : undefined}
          />
        </div>
      )
    case 'asking':
      return isAnswerer ? (
        <div className="flex flex-col gap-4 text-center">
          <p className="font-bold">{t.game.noDare}</p>
          <Button variant="ghost" onClick={() => state.act({ type: 'SKIP' })}>
            {t.game.skipFree}
          </Button>
        </div>
      ) : (
        <WrittenDareForm
          answerer={answerer}
          onSubmit={(text) => state.act({ type: 'PICK_WRITTEN', text })}
        />
      )
    case 'challenge':
      return turn.dare ? (
        <div className="flex flex-col items-center gap-6">
          <ChallengeCard
            dare={turn.dare}
            rotation={0}
            byline={format(t.roomGame.by, { name: nameOf(turn.askerId) })}
          />
          {isAnswerer ? (
            <div className="flex w-full max-w-sm flex-col gap-2.5">
              <Button size="lg" onClick={() => state.act({ type: 'COMPLETE' })}>
                {format(t.game.done, { points: `+${pointsFor(turn.kind!, 'done')}` })}
              </Button>
              <Button
                variant="ghost"
                className="normal-case tracking-normal"
                disabled={skipsLeft(game, selfId) === 0}
                onClick={() => state.act({ type: 'SKIP' })}
              >
                {format(t.game.skip, { count: skipsLeft(game, selfId) })}
              </Button>
            </div>
          ) : null}
          {skipAway}
        </div>
      ) : null
    default:
      return null
  }
}
