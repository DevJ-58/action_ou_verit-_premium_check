import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Emoji, Screen } from '@/design-system'
import { useT } from '@/i18n/useT'
import { activeRoomStore, useActiveRoom } from './activeRoom'
import { joinActiveRoom } from './joinActiveRoom'
import { TourButton } from '@/features/guide/TourButton'
import { LobbyView } from './LobbyView'
import { RoomGameView } from './RoomGameView'
import type { RoomError } from './types'

/** /salon/:code — joins the room if needed, then shows its lobby or its game. */
export function RoomScreen() {
  const t = useT()
  const navigate = useNavigate()
  const { code = '' } = useParams()
  const state = useActiveRoom((s) => s)
  const [error, setError] = useState<RoomError | null>(null)

  useEffect(() => {
    let alive = true
    void joinActiveRoom(code).then((failure) => alive && setError(failure))
    return () => {
      alive = false
    }
  }, [code])

  const leave = () => {
    activeRoomStore()?.getState().leave()
    navigate('/', { replace: true })
  }

  if (error) {
    return (
      <Screen back={() => navigate('/')} backLabel={t.common.back}>
        <div className="m-auto flex max-w-sm flex-col items-center gap-4 text-center">
          <Emoji name="seeNoEvil" size={64} />
          <p role="alert" className="text-lg font-semibold">
            {t.room.errors[error]}
          </p>
          <Link
            to="/salon/rejoindre"
            className="font-bold text-gold-text underline underline-offset-4"
          >
            {t.room.joinTitle}
          </Link>
        </div>
      </Screen>
    )
  }
  if (!state?.room || state.room.code !== code)
    return <div role="status" aria-busy="true" className="min-h-dvh" />

  return state.room.status === 'lobby' ? (
    <Screen
      wide
      title={t.room.lobbyTitle}
      back={leave}
      backLabel={t.room.leave}
      actions={<TourButton name="lobby" />}
    >
      <div className="pt-4">
        <LobbyView state={state} />
      </div>
    </Screen>
  ) : (
    <RoomGameView state={state} onLeave={leave} />
  )
}
