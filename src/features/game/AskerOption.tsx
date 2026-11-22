import type { ReactNode } from 'react'

export interface AskerOptionProps {
  icon: ReactNode
  title: string
  hint?: string
  onClick(): void
}

/** One of the asker's choices: game dare, own dare, or written dare. */
export function AskerOption({ icon, title, hint, onClick }: AskerOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-22 items-center gap-4 rounded-3xl border border-line p-4.5 text-left active:scale-[0.98]"
    >
      <span
        aria-hidden="true"
        className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-seat text-gold-text"
      >
        {icon}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[17px] font-bold">{title}</span>
        {hint ? <span className="text-sm text-muted">{hint}</span> : null}
      </span>
    </button>
  )
}
