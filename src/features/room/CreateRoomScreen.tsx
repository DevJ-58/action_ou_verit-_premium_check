import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { accountStore } from '@/features/account/accountStore'
import { isPremium } from '@/features/premium/premium'
import { memberFromProfile, openRoomStore } from './activeRoom'

/** Creates a room for the signed-in player, then opens its waiting room. */
export function CreateRoomScreen() {
  const navigate = useNavigate()
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const session = accountStore.getState().session
    const profile = session?.profile
    if (!profile) return
    void openRoomStore(memberFromProfile(profile, isPremium(session?.premiumUntil)))
      .getState()
      .createRoom()
      .then((code) => navigate(`/salon/${code}`, { replace: true }))
  }, [navigate])
  return <div role="status" aria-busy="true" className="min-h-dvh" />
}
