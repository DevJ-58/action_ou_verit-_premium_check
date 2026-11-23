import { useEffect, useRef } from 'react'
import type { GameAction } from '@/engine'
import { SPIN_MS } from '@/features/game/Bottle'
import type { RoomStoreState } from '../roomStore'

export const PICK_SECONDS = 30
export const CHOOSE_SECONDS = 30
export const NO_DARE_SECONDS = 45

/**
 * Host only: moves the game on so nobody waits forever — the bottle settles, a kind is
 * drawn for a silent answerer, proposals close at a fixed deadline (or as soon as everyone
 * proposed), a card is picked, and a turn nobody can fill is skipped.
 */
export function useHostTimers(state: RoomStoreState) {
  const game = state.room?.game
  const isHost = state.role === 'host'
  const phase = game?.phase
  const turnKey = game?.turn ? `${game.round}:${game.turn.answererId}:${game.history.length}` : ''
  const proposals = game?.turn?.proposals?.length ?? 0
  const others = (game?.players.length ?? 1) - 1
  const proposeSeconds = game?.settings.proposeSeconds ?? 60
  const act = state.act
  // When this phase started for this turn (the deadline must not move when proposals arrive).
  const startedAt = useRef<{ key: string; at: number } | null>(null)

  useEffect(() => {
    if (!isHost || !phase) return
    const key = `${turnKey}:${phase}`
    if (startedAt.current?.key !== key) startedAt.current = { key, at: Date.now() }
    const elapsed = Date.now() - startedAt.current.at

    let delay: number | null = null
    let action: GameAction | null = null
    if (phase === 'spinning') [delay, action] = [SPIN_MS, { type: 'SPIN_SETTLED' }]
    if (phase === 'choosing') [delay, action] = [CHOOSE_SECONDS * 1000, { type: 'TIMEOUT_CHOOSE' }]
    if (phase === 'proposing')
      [delay, action] = [
        proposals >= others ? 700 : proposeSeconds * 1000,
        { type: 'CLOSE_PROPOSALS' },
      ]
    if (phase === 'picking') [delay, action] = [PICK_SECONDS * 1000, { type: 'TIMEOUT_PICK' }]
    if (phase === 'asking') [delay, action] = [NO_DARE_SECONDS * 1000, { type: 'SKIP' }]
    if (delay === null || !action) return
    const chosen = action
    const remaining =
      phase === 'proposing' && proposals >= others ? delay : Math.max(0, delay - elapsed)
    const id = setTimeout(() => act(chosen), remaining)
    return () => clearTimeout(id)
  }, [isHost, phase, turnKey, proposals, others, proposeSeconds, act])
}
