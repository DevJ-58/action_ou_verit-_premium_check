import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { Button, Emoji, Segmented, Sheet } from '@/design-system'
import type { ChallengeKind, Dare } from '@/engine'
import { accountStore } from '@/features/account/accountStore'
import type { Profile } from '@/features/account/authService'
import type { CustomDareDraft } from '@/features/players/playersStore'
import { useT } from '@/i18n/useT'
import { CustomDareForm } from './CustomDareForm'
import { CustomDareList } from './CustomDareList'
import { hasDare, ownCopy, upsertDare } from './libraryOps'
import { SystemDareBrowser } from './SystemDareBrowser'

type Filter = 'all' | ChallengeKind

/** The signed-in player's dares: prepared in advance, filtered, edited, or taken from the game. */
export function AccountLibrary({ profile }: { profile: Profile }) {
  const t = useT()
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<CustomDareDraft | 'new' | null>(null)
  const [browsing, setBrowsing] = useState(false)
  const dares = profile.customDares
  const save = (customDares: Dare[]) => void accountStore.getState().updateProfile({ customDares })
  const shown = filter === 'all' ? dares : dares.filter((d) => d.kind === filter)

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5">
        <Button onClick={() => setEditing('new')}>
          <Plus aria-hidden="true" size={18} />
          {t.dareForm.add}
        </Button>
        <Button variant="ghost" onClick={() => setBrowsing(true)}>
          <Sparkles aria-hidden="true" size={18} />
          {t.myDares.fromGame}
        </Button>
      </div>
      {dares.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Emoji name="loveLetter" size={72} />
          <p className="max-w-xs font-semibold">{t.myDares.emptyLibrary}</p>
        </div>
      ) : (
        <>
          <Segmented<Filter>
            label={t.myDares.filter}
            value={filter}
            options={[
              { value: 'all', label: `${t.myDares.all} · ${dares.length}` },
              { value: 'truth', label: t.myDares.truths },
              { value: 'dare', label: t.myDares.dares },
            ]}
            onChange={setFilter}
          />
          <CustomDareList
            label={t.myDares.library}
            dares={shown}
            onEdit={(dare) => setEditing(dare)}
            onRemove={(dare) => save(dares.filter((d) => d.id !== dare.id))}
          />
        </>
      )}
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
              save(upsertDare(dares, ownCopy(draft, profile.id)))
              setEditing(null)
            }}
          />
        ) : null}
      </Sheet>
      <Sheet open={browsing} onClose={() => setBrowsing(false)} title={t.myDares.fromGameTitle}>
        <SystemDareBrowser
          verb={t.myDares.add}
          isTaken={(dare) => hasDare(dares, dare)}
          onPick={(dare) => save([...dares, ownCopy({ ...dare, id: undefined }, profile.id)])}
        />
      </Sheet>
    </section>
  )
}
