import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { Button, IconButton } from '@/design-system'
import { accountStore } from '@/features/account/accountStore'
import { PlayAgainWith } from '@/features/friends/PlayAgainWith'
import { RoomChat } from '@/features/chat/RoomChat'
import { useRoomChat } from '@/features/chat/useRoomChat'
import { RecapBody } from '@/features/game/RecapBody'
import { Table } from '@/features/game/Table'
import { useT } from '@/i18n/useT'
import { FloatingReactions } from './game/FloatingReactions'
import { ReactionBar } from './game/ReactionBar'
import { TurnStage } from './game/TurnStage'
import { useHostTimers } from './game/useHostTimers'
import { useRoomFeedback } from './game/useRoomFeedback'
import { useGameMusic } from '@/lib/audio/useGameMusic'
import { roomIsPremium } from './applyIntent'
import type { RoomStoreState } from './roomStore'

export interface RoomGameViewProps {
  state: RoomStoreState
  onLeave(): void
}

/** A room game as seen from one phone. */
export function RoomGameView({ state, onLeave }: RoomGameViewProps) {
  const t = useT()
  const reduceMotion = useReducedMotion() ?? false
  useHostTimers(state)
  const room = state.room!
  const game = room.game!
  useRoomFeedback(room, state.self.id)
  const chat = useRoomChat(room.code, state.self.id)
  useGameMusic(game.phase !== 'finished')
  const finished = game.phase === 'finished' ? game : null

  useEffect(() => {
    if (finished) void accountStore.getState().recordGame(finished)
  }, [finished])

  const tableVisible = ['ready', 'spinning', 'choosing'].includes(game.phase)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between pt-2">
        <IconButton label={t.room.leave} icon={<X size={18} />} onClick={onLeave} />
        <span className="text-xs font-extrabold tracking-[0.16em] text-muted uppercase">
          {t.game.round} <span className="text-lg text-text tabular-nums">{game.round}</span> /{' '}
          {game.settings.rounds}
        </span>
        <span className="flex items-center gap-2">
          <span className="hidden font-mono text-sm font-bold tracking-[0.2em] text-gold-text min-[380px]:inline">
            {room.code}
          </span>
          <RoomChat
            store={chat}
            members={room.members}
            selfId={state.self.id}
            voiceLocked={!roomIsPremium(room)}
          />
        </span>
      </header>

      <main className="flex flex-1 flex-col gap-6 pt-6 min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:items-center">
        {game.phase === 'finished' ? (
          <div className="flex flex-col gap-8 min-[900px]:col-span-2">
            <PlayAgainWith members={room.members} />
            <RecapBody
              game={game}
              onReplay={state.role === 'host' ? () => state.act({ type: 'RESTART' }) : undefined}
              onHome={onLeave}
            />
          </div>
        ) : (
          <>
            {tableVisible ? <Table game={game} animate={!reduceMotion} /> : null}
            <div className="flex flex-col justify-center gap-6">
              {game.phase === 'ready' || game.phase === 'spinning' ? (
                <Button
                  size="lg"
                  disabled={game.phase === 'spinning'}
                  onClick={() => state.act({ type: 'SPIN' })}
                >
                  {game.phase === 'spinning' ? t.game.spinning : t.roomGame.spinTurn}
                </Button>
              ) : (
                <TurnStage state={state} game={game} />
              )}
            </div>
          </>
        )}
      </main>

      {game.phase !== 'finished' ? (
        <footer className="pt-4">
          <ReactionBar onReact={state.react} />
        </footer>
      ) : null}
      <FloatingReactions reactions={room.reactions} members={room.members} />
    </div>
  )
}
