import type { ReactNode } from 'react'
import { Video } from 'lucide-react'
import { Button, Emoji } from '@/design-system'
import { pointsFor, skipsLeft, type GameState, type Turn } from '@/engine'
import { ChallengeCard } from '@/features/game/ChallengeCard'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import type { RoomStoreState } from '../roomStore'
import { AnswerBubble } from './AnswerBubble'
import { getChatTransport } from '@/features/chat/getChatTransport'
import { LiveBroadcastView } from '@/features/live/LiveBroadcastView'
import { LiveViewerView } from '@/features/live/LiveViewerView'
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
  const live = state.room?.live ?? null
  const liveSeconds = game.settings.liveSeconds ?? 0
  const code = state.room?.code ?? ''
  const duration = liveSeconds >= 60 ? `${liveSeconds / 60} min` : `${liveSeconds} s`
  const status = live
    ? format(t.live.isLive, { name: nameOf(live.by) })
    : turn.answer
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
      {live && live.by === selfId ? (
        <LiveBroadcastView
          code={code}
          selfId={selfId}
          live={live}
          onStop={() => state.setLive(false)}
        />
      ) : null}
      {live && live.by !== selfId ? (
        <LiveViewerView code={code} selfId={selfId} live={live} name={nameOf(live.by)} />
      ) : null}
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
      {isAnswerer && !live && liveSeconds > 0 ? (
        <div className="flex w-full max-w-sm flex-col gap-1.5">
          <Button variant="danger" onClick={() => state.setLive(true)}>
            <Video aria-hidden="true" size={18} />
            {format(t.live.start, { duration })}
          </Button>
          <p className="text-center text-xs text-muted">{t.live.hint}</p>
        </div>
      ) : null}
      {isAnswerer ? (
        <div className="flex w-full max-w-sm flex-col gap-2.5">
          <AnswerForm
            kind={kind}
            answered={Boolean(turn.answer)}
            onAnswer={(text) => state.act({ type: 'ANSWER', playerId: selfId, text })}
            onVoice={(note) =>
              void getChatTransport()
                .uploadVoice(state.room!.code, note.blob)
                .then((voiceId) =>
                  state.act({ type: 'ANSWER', playerId: selfId, voiceId, voiceMs: note.ms }),
                )
                .catch(() => {})
            }
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
