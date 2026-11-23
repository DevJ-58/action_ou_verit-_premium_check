import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from './IconButton'

export interface ScreenProps {
  title?: string
  back?: () => void
  backLabel?: string
  actions?: ReactNode
  /** Pages laid out in two columns on computers. */
  wide?: boolean
  children: ReactNode
}

/** Page frame: safe areas, optional header with back button, and the <main> landmark. */
export function Screen({
  title,
  back,
  backLabel = 'Retour',
  actions,
  wide = false,
  children,
}: ScreenProps) {
  const hasHeader = Boolean(title || back || actions)
  return (
    <div
      className={cn(
        'mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))]',
        wide ? 'min-[900px]:max-w-5xl min-[900px]:px-8' : 'md:max-w-2xl',
      )}
    >
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
