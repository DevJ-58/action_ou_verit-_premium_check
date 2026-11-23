import type { ReactNode } from 'react'
import { Button, Emoji } from '@/design-system'
import { pointsFor, skipsLeft, type GameState, type Turn } from '@/engine'
import { ChallengeCard } from '@/features/game/ChallengeCard'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import type { RoomStoreState } from '../roomStore'
import { AnswerBubble } from './AnswerBubble'
import { AnswerForm } from './AnswerForm'
import { VoteBar } from './VoteBar'

export interface ChallengeStageProps {
  state: RoomStoreState
  game: GameState
  turn: Turn & { dare: NonNullable<Turn['dare']> }
  nameOf(id: string): string
  extra?: ReactNode
}

/** The turned card on every phone: who answers, the answer, the verdicts, the end of the turn. */
export function ChallengeStage({ state, game, turn, nameOf, extra }: ChallengeStageProps) {
  const t = useT()
  const selfId = state.self.id
  const isAnswerer = turn.answererId === selfId
  const answerer = nameOf(turn.answererId)
  const kind = turn.kind ?? turn.dare.kind
  const status = turn.answer
    ? format(t.roomGame.answered, { name: answerer })
    : format(kind === 'truth' ? t.roomGame.thinking : t.roomGame.doing, { name: answerer })

  return (
    <div className="flex flex-col items-center gap-5">
      <p
        role="status"
        className="flex items-center gap-2 rounded-full bg-seat px-4 py-2 text-sm font-bold"
      >
        <Emoji
          name={turn.answer ? 'speech' : 'hourglass'}
          size={20}
          className={turn.answer ? undefined : 'motion-safe:animate-pulse'}
        />
        {status}
      </p>
      <ChallengeCard
        dare={turn.dare}
        rotation={0}
        byline={format(t.roomGame.by, { name: nameOf(turn.askerId) })}
      />
      {turn.answer ? <AnswerBubble answer={turn.answer} name={answerer} /> : null}
      {turn.answer || turn.votes ? (
        <VoteBar
          votes={turn.votes ?? {}}
          mine={isAnswerer ? undefined : (turn.votes?.[selfId] ?? null)}
          onVote={
            isAnswerer || !turn.answer
              ? undefined
              : (ok) => state.act({ type: 'VOTE', playerId: selfId, ok })
          }
        />
      ) : null}
      {isAnswerer ? (
        <div className="flex w-full max-w-sm flex-col gap-2.5">
          <AnswerForm
            kind={kind}
            answered={Boolean(turn.answer)}
            onAnswer={(text) => state.act({ type: 'ANSWER', playerId: selfId, text })}
          />
          <Button size="lg" onClick={() => state.act({ type: 'COMPLETE' })}>
            {format(t.game.done, { points: `+${pointsFor(kind, 'done')}` })}
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
      {extra}
    </div>
  )
}
