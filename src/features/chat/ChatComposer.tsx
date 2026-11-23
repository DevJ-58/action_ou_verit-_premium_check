import { useId, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Camera, Lock, Mic, SendHorizontal } from 'lucide-react'
import { PremiumMark } from '@/features/premium/PremiumMark'
import { PremiumSheet } from '@/features/premium/PremiumSheet'
import { useT } from '@/i18n/useT'
import type { ChatStore } from './chatStore'
import { compressImage } from './compressImage'
import { PhotoPreview } from './PhotoPreview'
import { PhotoSource } from './PhotoSource'
import { RecordingBar } from './RecordingBar'
import { CHAT_TEXT_MAX } from './types'
import { useVoiceRecorder, type VoiceNote } from './useVoiceRecorder'

const ROUND =
  'grid size-12 shrink-0 place-items-center rounded-full transition-transform active:scale-95'

/** The chat input: photo, text that grows, and one round button (mic or send). */
export function ChatComposer({
  store,
  premiumLocked = false,
}: {
  store: ChatStore
  premiumLocked?: boolean
}) {
  const t = useT()
  const id = useId()
  const [text, setText] = useState('')
  const [failed, setFailed] = useState(false)
  const [locked, setLocked] = useState<string | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [sendingPhoto, setSendingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const sendVoice = (note: VoiceNote) =>
    void store
      .getState()
      .sendVoice(note.blob, note.ms)
      .then((ok) => setFailed(!ok))
  const recorder = useVoiceRecorder({ onAutoStop: sendVoice })

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!text.trim()) return
    const draft = text
    setText('')
    const ok = await store.getState().sendText(draft)
    setFailed(!ok)
    if (!ok) setText(draft)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void submit()
    }
  }

  async function sendPhoto() {
    if (!photo) return
    setSendingPhoto(true)
    const small = await compressImage(photo)
    const ok = small
      ? await store.getState().sendPhoto(small.blob, small.width, small.height)
      : false
    setSendingPhoto(false)
    if (!ok) return setPhotoError(true)
    setPhoto(null)
  }

  if (recorder.status === 'recording') {
    return (
      <div className="border-t border-line pt-3">
        <RecordingBar
          seconds={recorder.seconds}
          onCancel={recorder.cancel}
          onSend={() => void recorder.stop().then((note) => note && sendVoice(note))}
        />
      </div>
    )
  }

  const hasText = text.trim().length > 0
  return (
    <div className="flex flex-col gap-1.5 border-t border-line pt-3">
      <form onSubmit={(e) => void submit(e)} className="flex items-end gap-2">
        <div className="flex min-h-12 min-w-0 flex-1 items-end gap-1 rounded-[24px] border-[1.5px] border-line bg-seat/50 py-1 pr-3 pl-1">
          <button
            type="button"
            aria-label={t.chat.photo}
            onClick={() => (premiumLocked ? setLocked(t.chat.lockedPhoto) : setChoosing(true))}
            className="relative grid size-10 shrink-0 place-items-center rounded-full text-muted"
          >
            <PremiumMark corner />
            {premiumLocked ? (
              <Lock aria-hidden="true" size={17} />
            ) : (
              <Camera aria-hidden="true" size={20} />
            )}
          </button>
          <label htmlFor={id} className="sr-only">
            {t.chat.message}
          </label>
          <textarea
            id={id}
            rows={1}
            value={text}
            maxLength={CHAT_TEXT_MAX}
            placeholder={t.chat.placeholder}
            autoComplete="off"
            enterKeyHint="send"
            onKeyDown={onKeyDown}
            onChange={(e) => setText(e.target.value)}
            className="field-sizing-content max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2 text-base leading-snug outline-none placeholder:text-muted/70"
          />
        </div>
        {hasText ? (
          <button
            type="submit"
            aria-label={t.chat.send}
            className={`${ROUND} bg-gold text-on-gold`}
          >
            <SendHorizontal aria-hidden="true" size={20} />
          </button>
        ) : (
          <button
            type="button"
            aria-label={t.chat.record}
            onClick={() =>
              premiumLocked ? setLocked(t.premium.lockedVoice) : void recorder.start()
            }
            className={`${ROUND} bg-gold text-on-gold`}
          >
            {premiumLocked ? (
              <Lock aria-hidden="true" size={18} />
            ) : (
              <Mic aria-hidden="true" size={20} />
            )}
          </button>
        )}
      </form>
      {failed ? <p className="text-sm font-semibold text-dare">{t.chat.failed}</p> : null}
      {recorder.status === 'denied' || recorder.status === 'unsupported' ? (
        <p role="alert" className="text-sm font-semibold text-dare">
          {recorder.status === 'denied' ? t.chat.denied : t.chat.unsupported}
        </p>
      ) : null}
      <PhotoSource
        open={choosing}
        onClose={() => setChoosing(false)}
        onFile={(file) => {
          setPhotoError(false)
          setPhoto(file)
        }}
      />
      <PhotoPreview
        file={photo}
        busy={sendingPhoto}
        error={photoError}
        onSend={() => void sendPhoto()}
        onCancel={() => setPhoto(null)}
      />
      <PremiumSheet
        open={locked !== null}
        onClose={() => setLocked(null)}
        reason={locked ?? ''}
        showLink={false}
      />
    </div>
  )
}
