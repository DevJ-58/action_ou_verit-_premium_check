import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { Segmented } from '@/design-system'
import { CATEGORIES } from '@/content/categories'
import { systemDares } from '@/content/systemDares'
import type { CategoryId, ChallengeKind, Dare } from '@/engine'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'
import { CategoryChips } from './CategoryChips'

export interface SystemDareBrowserProps {
  /** Fixed type (in a game); otherwise the player picks Truths or Dares. */
  kind?: ChallengeKind
  categories?: readonly CategoryId[]
  /** Extra rule, e.g. the answerer's limits. */
  accept?(dare: Dare): boolean
  isTaken?(dare: Dare): boolean
  takenLabel?: string
  verb: string
  onPick(dare: Dare): void
}

const ALL = CATEGORIES.map((c) => c.id)

/** The game's own dares, by category, ready to be added or chosen in one tap. */
export function SystemDareBrowser(props: SystemDareBrowserProps) {
  const { kind: fixedKind, categories = ALL, accept, isTaken, takenLabel, verb, onPick } = props
  const t = useT()
  const [kind, setKind] = useState<ChallengeKind>(fixedKind ?? 'truth')
  const [category, setCategory] = useState<CategoryId>(categories[0] ?? 'fun')
  const shownKind = fixedKind ?? kind
  const dares = systemDares.filter(
    (d) => d.kind === shownKind && d.category === category && (accept?.(d) ?? true),
  )
  return (
    <div className="flex flex-col gap-4">
      {fixedKind ? null : (
        <Segmented<ChallengeKind>
          label={t.myDares.filter}
          value={kind}
          options={[
            { value: 'truth', label: t.myDares.truths },
            { value: 'dare', label: t.myDares.dares },
          ]}
          onChange={setKind}
        />
      )}
      <CategoryChips
        label={t.myDares.categoryLabel}
        categories={categories}
        value={category}
        onChange={setCategory}
      />
      {dares.length === 0 ? (
        <p className="py-6 text-center text-muted">{t.myDares.noneHere}</p>
      ) : null}
      <ul className="flex max-h-[50dvh] flex-col gap-2 overflow-y-auto">
        {dares.map((dare) => {
          const taken = isTaken?.(dare) ?? false
          return (
            <li
              key={dare.id}
              className="flex items-center gap-3 rounded-[18px] border border-line p-3"
            >
              <span className="flex-1 text-[15px] leading-snug font-semibold">{dare.text}</span>
              <button
                type="button"
                disabled={taken}
                aria-label={taken ? (takenLabel ?? t.myDares.taken) : `${verb} : ${dare.text}`}
                onClick={() => onPick(dare)}
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-full border-[1.5px]',
                  taken ? 'border-transparent text-gold-text' : 'border-gold text-gold-text',
                )}
              >
                {taken ? (
                  <Check aria-hidden="true" size={18} />
                ) : (
                  <Plus aria-hidden="true" size={18} />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
