import { useId, useState } from 'react'
import { BIO_MAX } from '@/features/account/authService'

export interface BioFieldProps {
  label: string
  placeholder: string
  value: string
  onSave(bio: string): void
}

/** Short bio, saved when the field loses focus. */
export function BioField({ label, placeholder, value, onSave }: BioFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-extrabold tracking-[0.18em] text-muted uppercase">
        {label}
      </label>
      <textarea
        id={id}
        rows={2}
        maxLength={BIO_MAX}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value.slice(0, BIO_MAX))}
        onBlur={() => draft !== value && onSave(draft.trim())}
        className="resize-none rounded-[20px] border-[1.5px] border-line bg-transparent p-4 text-base leading-relaxed"
      />
      <span className="self-end text-xs text-muted tabular-nums">
        {draft.length} / {BIO_MAX}
      </span>
    </div>
  )
}
