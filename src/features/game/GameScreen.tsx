import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useReducedMotion } from 'motion/react'
import { Button } from '@/design-system'
import { cardRotationFor, pointsFor, seatAngle, skipsLeft, type GameAction } from '@/engine'
import { feedback } from '@/lib/feedback'
import { useGameMusic } from '@/lib/audio/useGameMusic'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { AskerPanel } from './AskerPanel'
import { SPIN_MS } from './Bottle'
import { ChallengeCard } from './ChallengeCard'
import { CountdownRing } from './CountdownRing'
import { GameHeader } from './GameHeader'
import { gameStore, useGame } from './gameStore'
import { KindChooser } from './KindChooser'
import { Table } from './Table'

export function GameScreen() {
  const t = useT()
  const navigate = useNavigate()
  const game = useGame((s) => s.game)
  const reduceMotion = useReducedMotion() ?? false
  const phase = game?.phase
  // A game reloaded while spinning lands at once on the already-drawn player.
  const [resumedSpinning, setResumedSpinning] = useState(phase === 'spinning')
  const dispatch = (action: GameAction) => gameStore.getState().dispatch(action)
  useGameMusic(Boolean(game) && phase !== 'finished')

  useEffect(() => {
    if (phase !== 'spinning') return
    const delay = reduceMotion || resumedSpinning ? 0 : SPIN_MS
    const id = setTimeout(() => {
      setResumedSpinning(false)
      gameStore.getState().dispatch({ type: 'SPIN_SETTLED' })
      feedback.reveal()
    }, delay)
    return () => clearTimeout(id)
  }, [phase, reduceMotion, resumedSpinning])

  if (!game) return <Navigate to="/" replace />
  if (game.phase === 'finished') return <Navigate to="/partie/recap" replace />

  const { turn, players } = game
  const nameOf = (id: string) => players.find((p) => p.id === id)!.name
  const answererIndex = turn ? players.findIndex((p) => p.id === turn.answererId) : -1

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <GameHeader
        round={game.round}
        rounds={game.settings.rounds}
        onQuit={() => {
          gameStore.getState().quit()
          navigate('/', { replace: true })
        }}
      />
      <main className="flex flex-1 flex-col pt-6">
        {game.phase === 'asking' && turn ? (
          <AskerPanel game={game} turn={turn} dispatch={dispatch} />
        ) : game.phase === 'challenge' && turn?.dare ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">
                {format(t.game.askedBy, { name: nameOf(turn.askerId) })}
              </span>
              {game.settings.timerSeconds > 0 ? (
                <CountdownRing key={turn.dare.id} seconds={game.settings.timerSeconds} />
              ) : null}
            </div>
            <div className="flex flex-1 items-center justify-center py-6">
              <ChallengeCard
                dare={turn.dare}
                rotation={cardRotationFor(seatAngle(answererIndex, players.length))}
                byline={nameOf(turn.answererId)}
              />
            </div>
            <div className="flex flex-col gap-2.5">
              <Button
                size="lg"
                onClick={() => {
                  feedback.success()
                  dispatch({ type: 'COMPLETE' })
                }}
              >
                {format(t.game.done, { points: `+${pointsFor(turn.kind!, 'done')}` })}
              </Button>
              <Button
                variant="ghost"
                className="normal-case tracking-normal"
                disabled={skipsLeft(game, turn.answererId) === 0}
                onClick={() => dispatch({ type: 'SKIP' })}
              >
                {format(t.game.skip, { count: skipsLeft(game, turn.answererId) })}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Table game={game} animate={!reduceMotion && !resumedSpinning} />
            <div className="mt-auto pt-6">
              {game.phase === 'choosing' && turn ? (
                <KindChooser
                  answerer={nameOf(turn.answererId)}
                  subtitle={format(t.game.askerWillAsk, { name: nameOf(turn.askerId) })}
                  onChoose={(kind) => dispatch({ type: 'CHOOSE_KIND', kind })}
                />
              ) : (
                <div className="flex flex-col gap-4 text-center">
                  <p className="text-[26px] font-extrabold tracking-[-0.02em]">
                    {t.game.whoIsNext}
                  </p>
                  <Button
                    size="lg"
                    disabled={game.phase === 'spinning'}
                    onClick={() => dispatch({ type: 'SPIN' })}
                  >
                    {game.phase === 'spinning'
                      ? t.game.spinning
                      : game.settings.picker === 'random'
                        ? t.game.draw
                        : t.game.spin}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
