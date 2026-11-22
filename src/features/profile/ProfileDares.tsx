import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, Sheet } from '@/design-system'
import type { Dare } from '@/engine'
import { CustomDareForm } from '@/features/dares/CustomDareForm'
import { CustomDareList } from '@/features/dares/CustomDareList'
import type { CustomDareDraft } from '@/features/players/playersStore'
import { useT } from '@/i18n/useT'
import { newId } from '@/lib/id'

export interface ProfileDaresProps {
  ownerId: string
  dares: Dare[]
  onChange(dares: Dare[]): void
}

/** The player's own dares, kept in their profile. */
export function ProfileDares({ ownerId, dares, onChange }: ProfileDaresProps) {
  const t = useT()
  const [editing, setEditing] = useState<CustomDareDraft | 'new' | null>(null)
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-extrabold">{t.profile.myDares}</h2>
        <p className="text-sm text-muted">{t.profile.myDaresHint}</p>
      </div>
      <CustomDareList
        dares={dares}
        onEdit={(dare) => setEditing(dare)}
        onRemove={(dare) => onChange(dares.filter((d) => d.id !== dare.id))}
      />
      <Button variant="ghost" onClick={() => setEditing('new')}>
        <Plus aria-hidden="true" size={18} />
        {t.dareForm.add}
      </Button>
      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? t.dareForm.newTitle : t.dareForm.editTitle}
      >
        {editing !== null ? (
          <CustomDareForm
            initial={editing === 'new' ? undefined : editing}
            onCancel={() => setEditing(null)}
            onSave={(draft) => {
              const dare: Dare = { ...draft, id: draft.id ?? newId('custom'), authorId: ownerId }
              onChange(
                dares.some((d) => d.id === dare.id)
                  ? dares.map((d) => (d.id === dare.id ? dare : d))
                  : [...dares, dare],
              )
              setEditing(null)
            }}
          />
        ) : null}
      </Sheet>
    </section>
  )
}
