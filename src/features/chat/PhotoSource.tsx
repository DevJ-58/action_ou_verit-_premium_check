import { useId } from 'react'
import { Camera, Images } from 'lucide-react'
import { Sheet } from '@/design-system'
import { useT } from '@/i18n/useT'

export interface PhotoSourceProps {
  open: boolean
  onClose(): void
  onFile(file: File): void
}

/** Take a photo with the camera, or choose one from the gallery. */
export function PhotoSource({ open, onClose, onFile }: PhotoSourceProps) {
  const t = useT()
  const id = useId()
  const pick = (file: File | undefined) => {
    if (!file) return
    onClose()
    onFile(file)
  }
  const option = (key: 'take' | 'pick') => (
    <label
      htmlFor={`${id}-${key}`}
      className="flex min-h-16 cursor-pointer items-center gap-3 rounded-[20px] border-[1.5px] border-line px-4 font-bold has-focus-visible:outline-2 has-focus-visible:outline-gold"
    >
      {key === 'take' ? (
        <Camera aria-hidden="true" size={22} className="text-gold-text" />
      ) : (
        <Images aria-hidden="true" size={22} className="text-gold-text" />
      )}
      {key === 'take' ? t.chat.takePhoto : t.chat.pickPhoto}
      <input
        id={`${id}-${key}`}
        type="file"
        accept="image/*"
        {...(key === 'take' ? { capture: 'environment' as const } : {})}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          pick(file)
        }}
      />
    </label>
  )
  return (
    <Sheet open={open} onClose={onClose} title={t.chat.photo}>
      <div className="flex flex-col gap-2.5 pb-1">
        {option('take')}
        {option('pick')}
        <p className="text-sm text-muted">{t.chat.photoLimit}</p>
      </div>
    </Sheet>
  )
}
