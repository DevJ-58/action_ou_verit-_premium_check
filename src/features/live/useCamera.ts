import { useEffect, useState } from 'react'

export type Facing = 'user' | 'environment'
export type CameraState =
  | { status: 'starting' }
  | { status: 'on'; stream: MediaStream }
  | { status: 'denied' | 'unavailable' }

const VIDEO = { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } }

/** Opens the camera (and microphone) while the component lives; releases them after. */
export function useCamera(facing: Facing): CameraState {
  const [state, setState] = useState<CameraState>({ status: 'starting' })
  useEffect(() => {
    let stream: MediaStream | null = null
    let stopped = false
    void (async () => {
      if (!navigator.mediaDevices?.getUserMedia) return setState({ status: 'unavailable' })
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { ...VIDEO, facingMode: facing },
          audio: { echoCancellation: true, noiseSuppression: true },
        })
      } catch (error) {
        const denied = error instanceof DOMException && error.name === 'NotAllowedError'
        return setState({ status: denied ? 'denied' : 'unavailable' })
      }
      if (stopped) return stream.getTracks().forEach((t) => t.stop())
      setState({ status: 'on', stream })
    })()
    return () => {
      stopped = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [facing])
  return state
}
