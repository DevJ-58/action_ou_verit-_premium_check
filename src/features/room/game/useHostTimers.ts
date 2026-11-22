import { useEffect } from 'react'
import { SPIN_MS } from '@/features/game/Bottle'
import type { RoomStoreState } from '../roomStore'

export const PICK_SECONDS = 30

/** Host only: moves the game on (bottle settles, proposals close, a card gets picked) so nobody waits forever. */
export function useHostTimers(state: RoomStoreState) {
  const game = state.room?.game
  const isHost = state.role === 'host'
  const phase = game?.phase
  const proposals = game?.turn?.proposals?.length ?? 0
  const others = (game?.players.length ?? 1) - 1
  const proposeSeconds = game?.settings.proposeSeconds ?? 60
  const act = state.act

  useEffect(() => {
    if (!isHost || !phase) return
    let delay: number | null = null
    let action: Parameters<typeof act>[0] | null = null
    if (phase === 'spinning') [delay, action] = [SPIN_MS, { type: 'SPIN_SETTLED' }]
    if (phase === 'proposing')
      [delay, action] = [
        proposals >= others ? 700 : proposeSeconds * 1000,
        { type: 'CLOSE_PROPOSALS' },
      ]
    if (phase === 'picking') [delay, action] = [PICK_SECONDS * 1000, { type: 'TIMEOUT_PICK' }]
    if (delay === null || !action) return
    const chosen = action
    const id = setTimeout(() => act(chosen), delay)
    return () => clearTimeout(id)
  }, [isHost, phase, proposals, others, proposeSeconds, act])
}
