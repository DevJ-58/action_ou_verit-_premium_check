import { Mic } from 'lucide-react'
import { Avatar, Emoji } from '@/design-system'
import type { Member } from '@/features/room/types'
import { useSettings } from '@/features/settings/settingsStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { VOICES, voiceFor } from './presets'

export interface VoiceStripProps {
  members: Member[]
  talking: string[]
  selfId: string
}

/** Who has their mic on, each with the voice of their avatar. */
export function VoiceStrip({ members, talking, selfId }: VoiceStripProps) {
  const t = useT()
  const language = useSettings((s) => s.language)
  const people = talking.flatMap((id) => members.find((m) => m.id === id) ?? [])
  if (people.length === 0) return null
  const mine = people.find((m) => m.id === selfId)
  return (
    <div className="flex flex-col gap-1">
      <ul aria-label={t.voice.talking} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {people.map((m) => {
          const voice = VOICES[voiceFor(m.avatarId)]
          return (
            <li
              key={m.id}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-seat py-1 pr-3 pl-1"
            >
              <Avatar name={m.pseudo} avatarId={m.avatarId} size="sm" />
              <span className="flex flex-col leading-tight">
                <span className="flex items-center gap-1 text-sm font-bold">
                  <Mic aria-hidden="true" size={12} className="text-dare" />
                  {m.pseudo}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-muted">
                  <Emoji name={voice.emoji} size={12} />
                  {voice.label[language]}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
      {mine ? (
        <p className="text-xs text-muted">
          {format(t.voice.myVoice, { voice: VOICES[voiceFor(mine.avatarId)].label[language] })} ·{' '}
          {t.voice.hint}
        </p>
      ) : null}
    </div>
  )
}
