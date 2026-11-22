import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { IconButton } from './IconButton'

export interface ScreenProps {
  title?: string
  back?: () => void
  backLabel?: string
  actions?: ReactNode
  children: ReactNode
}

/** Page frame: safe areas, optional header with back button, and the <main> landmark. */
export function Screen({ title, back, backLabel = 'Retour', actions, children }: ScreenProps) {
  const hasHeader = Boolean(title || back || actions)
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))]">
      {hasHeader ? (
        <header className="flex min-h-14 items-center gap-3 pt-2">
          {back ? (
            <IconButton label={backLabel} icon={<ChevronLeft size={20} />} onClick={back} />
          ) : null}
          {title ? (
            <h1 className="flex-1 text-[26px] font-extrabold tracking-[-0.02em]">{title}</h1>
          ) : null}
          {actions}
        </header>
      ) : null}
      <main className="flex flex-1 flex-col pb-6">{children}</main>
    </div>
  )
}
