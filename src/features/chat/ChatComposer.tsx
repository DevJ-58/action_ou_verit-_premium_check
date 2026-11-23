import { useId, useState, type FormEvent } from 'react'
import { SendHorizontal } from 'lucide-react'
import { IconButton } from '@/design-system'
import { useT } from '@/i18n/useT'
import type { ChatStore } from './chatStore'
import { CHAT_TEXT_MAX } from './types'
import { VoiceRecorderBar } from './VoiceRecorderBar'

/** Write a message, or record a voice note. */
export function ChatComposer({
  store,
  voiceLocked = false,
}: {
  store: ChatStore
  voiceLocked?: boolean
}) {
  const t = useT()
  const id = useId()
  const [text, setText] = useState('')
  const [failed, setFailed] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!text.trim()) return
    const draft = text
    setText('')
    const ok = await store.getState().sendText(draft)
    setFailed(!ok)
    if (!ok) setText(draft)
  }

  return (
    <div className="flex flex-col gap-1.5 border-t border-line pt-3">
      <VoiceRecorderBar
        locked={voiceLocked}
        onNote={(note) =>
          void store
            .getState()
            .sendVoice(note.blob, note.ms)
            .then((ok) => setFailed(!ok))
        }
      >
        <form onSubmit={(e) => void submit(e)} className="flex flex-1 items-center gap-2">
          <label htmlFor={id} className="sr-only">
            {t.chat.message}
          </label>
          <input
            id={id}
            value={text}
            maxLength={CHAT_TEXT_MAX}
            placeholder={t.chat.placeholder}
            autoComplete="off"
            onChange={(e) => setText(e.target.value)}
            className="min-h-12 min-w-0 flex-1 rounded-full border-[1.5px] border-line bg-transparent px-4 text-base"
          />
          <IconButton
            type="submit"
            label={t.chat.send}
            icon={<SendHorizontal size={18} />}
            className="border-gold bg-gold text-on-gold"
          />
        </form>
      </VoiceRecorderBar>
      {failed ? <p className="text-sm font-semibold text-dare">{t.chat.failed}</p> : null}
    </div>
  )
}
