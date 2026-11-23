import { useEffect, useMemo } from 'react'
import { Send } from 'lucide-react'
import { Button, Sheet } from '@/design-system'
import { useT } from '@/i18n/useT'

export interface PhotoPreviewProps {
  file: Blob | null
  busy: boolean
  error: boolean
  onSend(): void
  onCancel(): void
}

/** Shows the chosen photo before it is sent. */
export function PhotoPreview({ file, busy, error, onSend, onCancel }: PhotoPreviewProps) {
  const t = useT()
  const url = useMemo(() => (file ? (URL.createObjectURL?.(file) ?? null) : null), [file])
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  return (
    <Sheet open={file !== null} onClose={onCancel} title={t.chat.photoTitle}>
      <div className="flex flex-col gap-4">
        {url ? (
          <img
            src={url}
            alt=""
            className="max-h-[55dvh] w-full rounded-[20px] bg-ink object-contain"
          />
        ) : null}
        {error ? <p className="font-semibold text-dare">{t.chat.photoTooBig}</p> : null}
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="ghost" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button loading={busy} onClick={onSend}>
            <Send aria-hidden="true" size={17} />
            {t.chat.sendPhoto}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
