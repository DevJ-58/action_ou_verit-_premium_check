import { useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { PremiumMark } from '@/features/premium/PremiumMark'
import { PremiumSheet } from '@/features/premium/PremiumSheet'
import { roomIsPremium } from '@/features/room/applyIntent'
import type { RoomStoreState } from '@/features/room/roomStore'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'

/** Header button: turns this player's live mic on or off (Premium host required). */
export function VoiceButton({ state }: { state: RoomStoreState }) {
  const t = useT()
  const [locked, setLocked] = useState(false)
  const room = state.room
  if (!room) return null
  const on = room.voice?.includes(state.self.id) ?? false
  return (
    <>
      <button
        type="button"
        aria-pressed={on}
        aria-label={on ? t.voice.leave : t.voice.join}
        onClick={() => {
          if (on) return state.setVoice(false)
          if (!roomIsPremium(room)) return setLocked(true)
          state.setVoice(true)
        }}
        className={cn(
          'relative grid size-12 place-items-center rounded-full border-[1.5px] active:scale-95',
          on ? 'border-dare bg-dare text-ivory' : 'border-line text-text',
        )}
      >
        {on ? <Mic aria-hidden="true" size={20} /> : <MicOff aria-hidden="true" size={20} />}
        {on ? (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2 border-dare motion-safe:animate-ping"
          />
        ) : (
          <PremiumMark corner />
        )}
      </button>
      <PremiumSheet
        open={locked}
        onClose={() => setLocked(false)}
        reason={t.voice.locked}
        showLink={false}
      />
    </>
  )
}
