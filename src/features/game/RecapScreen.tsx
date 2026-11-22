import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { KenteBand } from '@/design-system'
import { statsStore } from '@/features/players/statsStore'
import { gameStore, useGame } from './gameStore'
import { RecapBody } from './RecapBody'

export function RecapScreen() {
  const navigate = useNavigate()
  const game = useGame((s) => s.game)
  const finished = game?.phase === 'finished' ? game : null

  useEffect(() => {
    if (finished) statsStore.getState().recordGame(finished)
  }, [finished])

  if (!finished) return <Navigate to={game ? '/partie' : '/'} replace />

  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)]">
      <KenteBand />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pt-8 pb-6">
        <RecapBody
          game={finished}
          onReplay={() => {
            gameStore.getState().dispatch({ type: 'RESTART' })
            navigate('/partie', { replace: true })
          }}
          onHome={() => {
            gameStore.getState().quit()
            navigate('/', { replace: true })
          }}
        />
      </main>
    </div>
  )
}
