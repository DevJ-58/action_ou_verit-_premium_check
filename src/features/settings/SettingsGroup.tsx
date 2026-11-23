import type { ReactNode } from 'react'
import { Emoji } from '@/design-system'
import type { EmojiName } from '@/content/emoji'

export interface SettingsGroupProps {
  emoji: EmojiName
  title: string
  hint?: string
  children: ReactNode
}

/** A titled block of the settings page. */
export function SettingsGroup({ emoji, title, hint, children }: SettingsGroupProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <Emoji name={emoji} size={28} />
        <div>
          <h2 className="text-lg font-extrabold">{title}</h2>
          {hint ? <p className="text-sm text-muted">{hint}</p> : null}
        </div>
      </div>
      {children}
    </section>
  )
}
