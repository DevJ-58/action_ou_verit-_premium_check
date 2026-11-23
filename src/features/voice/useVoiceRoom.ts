import { useEffect, useRef, useState } from 'react'
import { getSignalTransport } from '@/features/live/getSignalTransport'
import type { RoomStoreState } from '@/features/room/roomStore'
import { audioContext } from '@/lib/audio/context'
import { voiceFor } from './presets'
import { changeVoice, type VoiceChain } from './voiceChain'
import { createVoiceMesh, type VoiceMesh } from './voiceMesh'

export type VoiceStatus = 'off' | 'starting' | 'on' | 'denied'

const NONE: string[] = []

/** While this player's mic is on: mic → avatar voice → every other open mic, and their voices back. */
export function useVoiceRoom(state: RoomStoreState) {
  const code = state.room?.code ?? ''
  const selfId = state.self.id
  const avatarId = state.self.avatarId
  const talking = state.room?.voice ?? NONE
  const on = talking.includes(selfId)
  const setVoice = state.setVoice
  const [phase, setPhase] = useState<'ready' | 'denied' | null>(null)
  const [remote, setRemote] = useState<ReadonlyMap<string, MediaStream>>(new Map())
  const [local, setLocal] = useState<MediaStream | null>(null)
  const mesh = useRef<VoiceMesh | null>(null)
  const talkingRef = useRef(talking)

  useEffect(() => {
    talkingRef.current = talking
    mesh.current?.update(talking)
  }, [talking])

  useEffect(() => {
    if (!on || !code) return
    let stopped = false
    let mic: MediaStream | null = null
    let chain: VoiceChain | null = null
    void (async () => {
      try {
        mic = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        })
      } catch {
        setPhase('denied')
        setVoice(false)
        return
      }
      if (stopped) return mic.getTracks().forEach((t) => t.stop())
      const ctx = audioContext()
      chain = ctx ? changeVoice(ctx, mic, voiceFor(avatarId)) : null
      mesh.current = createVoiceMesh({
        code,
        selfId,
        stream: chain?.stream ?? mic,
        transport: getSignalTransport(),
        onStream: (from, stream) =>
          setRemote((current) => {
            const next = new Map(current)
            if (stream) next.set(from, stream)
            else next.delete(from)
            return next
          }),
      })
      mesh.current.update(talkingRef.current)
      setLocal(chain?.stream ?? mic)
      setPhase('ready')
    })()
    return () => {
      stopped = true
      mesh.current?.stop()
      mesh.current = null
      chain?.stop()
      mic?.getTracks().forEach((t) => t.stop())
      setRemote(new Map())
      setLocal(null)
      setPhase((p) => (p === 'denied' ? p : null))
    }
  }, [on, code, selfId, avatarId, setVoice])

  const status: VoiceStatus = on
    ? phase === 'ready'
      ? 'on'
      : 'starting'
    : phase === 'denied'
      ? 'denied'
      : 'off'
  return { status, remote, local }
}
