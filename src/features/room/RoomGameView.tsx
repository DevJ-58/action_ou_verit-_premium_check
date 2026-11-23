import { useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { Button, IconButton } from '@/design-system'
import { accountStore } from '@/features/account/accountStore'
import { PlayAgainWith } from '@/features/friends/PlayAgainWith'
import { GamePlayersButton } from '@/features/friends/GamePlayersButton'
import { openProfile } from '@/features/friends/profileViewer'
import { format } from '@/i18n/format'
import { RoomChat } from '@/features/chat/RoomChat'
import { VoiceButton } from '@/features/voice/VoiceButton'
import { VoiceSpeakers } from '@/features/voice/VoiceSpeakers'
import { VoiceStrip } from '@/features/voice/VoiceStrip'
import { useVoiceRoom } from '@/features/voice/useVoiceRoom'
import { useSpeaking } from '@/features/voice/speaking'
import { useRoomChat } from '@/features/chat/useRoomChat'
import { useReadDare } from '@/features/game/useReadDare'
import { RecapBody } from '@/features/game/RecapBody'
import { Table } from '@/features/game/Table'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'
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
  const voice = useVoiceRoom(state)
  useReadDare(game)
  const voices = useMemo(() => {
    const all = new Map(voice.remote)
    if (voice.local) all.set(state.self.id, voice.local)
    return all
  }, [voice.remote, voice.local, state.self.id])
  const speaking = useSpeaking(voices)
  // The music stops while this player's mic is on, so voices are heard clearly.
  const micOn = room.voice?.includes(state.self.id) ?? false
  useGameMusic(game.phase !== 'finished' && !micOn)
  const finished = game.phase === 'finished' ? game : null

  const lastGame = room.lastGame ?? null
  useEffect(() => {
    // Counted once per game id (also when this phone missed the end and only sees the replay).
    if (finished) void accountStore.getState().recordGame(finished)
    if (lastGame) void accountStore.getState().recordGame(lastGame)
  }, [finished, lastGame])

  const tableVisible = ['ready', 'spinning', 'choosing'].includes(game.phase)
  const chooserHere = game.phase === 'choosing' && game.turn?.answererId === state.self.id

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between pt-2">
        <IconButton label={t.room.leave} icon={<X size={18} />} onClick={onLeave} />
        <span className="text-xs font-extrabold tracking-[0.16em] whitespace-nowrap text-muted uppercase">
          <span className="max-[379px]:sr-only">{t.game.round} </span>
          <span className="text-lg text-text tabular-nums">{game.round}</span>/
          {game.settings.rounds}
        </span>
        <span className="flex items-center gap-1.5 min-[380px]:gap-2">
          <span className="hidden font-mono text-sm font-bold tracking-[0.2em] text-gold-text min-[460px]:inline">
            {room.code}
          </span>
          <GamePlayersButton members={room.members} selfId={state.self.id} online={state.online} />
          <VoiceButton state={state} />
          <RoomChat
            store={chat}
            members={room.members}
            selfId={state.self.id}
            premiumLocked={!roomIsPremium(room)}
          />
        </span>
      </header>
      <div className="pt-3 empty:hidden">
        <VoiceStrip
          members={room.members}
          talking={room.voice ?? []}
          selfId={state.self.id}
          speaking={speaking}
        />
        {voice.status === 'denied' ? (
          <p role="alert" className="text-sm font-semibold text-dare">
            {t.voice.denied}
          </p>
        ) : null}
      </div>
      <VoiceSpeakers remote={voice.remote} />

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
            {tableVisible ? (
              // The player choosing needs the Truth / Dare buttons in view on small phones.
              <div className={chooserHere ? 'max-[899px]:hidden' : undefined}>
                <Table
                  game={game}
                  animate={!reduceMotion}
                  onPlayer={openProfile}
                  playerLabel={(name) => format(t.friends.seeProfile, { name })}
                />
              </div>
            ) : null}
            <div
              className={cn(
                'flex flex-col justify-center gap-6',
                !tableVisible && 'min-[900px]:col-span-2',
              )}
            >
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
