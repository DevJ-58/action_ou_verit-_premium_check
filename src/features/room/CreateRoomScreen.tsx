import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { accountStore } from '@/features/account/accountStore'
import { isPremium } from '@/features/premium/premium'
import { memberFromProfile, openRoomStore } from './activeRoom'

/** Creates a room for the signed-in player, then opens its waiting room. */
export function CreateRoomScreen() {
  const navigate = useNavigate()
  const started = useRef(false)
  // « Jouer avec l'IA »: Axis is seated as soon as the room exists.
  const withAxis = useSearchParams()[0].get('ia') === '1'
  useEffect(() => {
    if (started.current) return
    started.current = true
    const session = accountStore.getState().session
    const profile = session?.profile
    if (!profile) return
    const store = openRoomStore(memberFromProfile(profile, isPremium(session?.premiumUntil)))
    void store
      .getState()
      .createRoom()
      .then((code) => {
        if (withAxis) store.getState().setBot(true)
        navigate(`/salon/${code}`, { replace: true })
      })
  }, [navigate, withAxis])
  return <div role="status" aria-busy="true" className="min-h-dvh" />
}
