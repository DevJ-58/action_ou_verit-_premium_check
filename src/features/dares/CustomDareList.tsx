import { Pencil, Trash2 } from 'lucide-react'
import { IconButton } from '@/design-system'
import type { Dare } from '@/engine'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'

export interface CustomDareListProps {
  label?: string
  dares: Dare[]
  onEdit(dare: Dare): void
  onRemove(dare: Dare): void
}

export function CustomDareList({ label, dares, onEdit, onRemove }: CustomDareListProps) {
  const t = useT()
  return (
    <ul aria-label={label} className="flex flex-col gap-3">
      {dares.map((dare) => (
        <li key={dare.id} className="flex items-start gap-3 rounded-xl border border-line p-4">
          <span
            className={cn(
              'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md font-display text-lg',
              dare.kind === 'truth' ? 'bg-truth text-ivory' : 'bg-card-ivory text-dare-ink',
            )}
            aria-label={dare.kind === 'truth' ? t.dareForm.truth : t.dareForm.dare}
            role="img"
          >
            {dare.kind === 'truth' ? 'V' : 'A'}
          </span>
          <span className="flex flex-1 flex-col gap-1">
            <span className="text-base leading-snug font-semibold">{dare.text}</span>
            <span className="text-xs font-bold tracking-[0.12em] text-muted uppercase">
              {t.categories[dare.category].name} · {dare.intensity}
            </span>
          </span>
          <IconButton
            label={t.dareForm.editTitle}
            icon={<Pencil size={16} />}
            onClick={() => onEdit(dare)}
          />
          <IconButton
            label={t.dareForm.removeDare}
            icon={<Trash2 size={16} />}
            onClick={() => onRemove(dare)}
          />
        </li>
      ))}
    </ul>
  )
}
