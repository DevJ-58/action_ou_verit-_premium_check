import { useId, useState, type FormEvent } from 'react'
import { Button, Segmented, Toggle } from '@/design-system'
import { CATEGORIES, categoryMeta } from '@/content/categories'
import { validateWrittenDare, type CategoryId, type ChallengeKind, type Intensity } from '@/engine'
import type { CustomDareDraft } from '@/features/players/playersStore'
import { useT } from '@/i18n/useT'

export interface CustomDareFormProps {
  initial?: CustomDareDraft
  onSave(draft: CustomDareDraft): void
  onCancel(): void
}

function intensitiesOf(category: CategoryId): Intensity[] {
  const [min, max] = categoryMeta(category).intensity
  return Array.from({ length: max - min + 1 }, (_, i) => (min + i) as Intensity)
}

export function CustomDareForm({ initial, onSave, onCancel }: CustomDareFormProps) {
  const t = useT()
  const ids = { category: useId(), text: useId(), error: useId() }
  const [kind, setKind] = useState<ChallengeKind>(initial?.kind ?? 'dare')
  const [category, setCategory] = useState<CategoryId>(initial?.category ?? 'fun')
  const [intensity, setIntensity] = useState<Intensity>(initial?.intensity ?? 1)
  const [remote, setRemote] = useState(initial ? initial.modes.includes('remote') : true)
  const [text, setText] = useState(initial?.text ?? '')
  const [error, setError] = useState<string | null>(null)

  const allowed = intensitiesOf(category)
  const effectiveIntensity = allowed.includes(intensity) ? intensity : allowed[0]!

  function submit(event: FormEvent) {
    event.preventDefault()
    const result = validateWrittenDare(text)
    if (!result.ok) {
      setError(t.dareForm.errors[result.reason])
      return
    }
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      kind,
      category,
      intensity: effectiveIntensity,
      modes: remote ? ['nearby', 'remote'] : ['nearby'],
      text: result.text,
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Segmented<ChallengeKind>
        label={t.dareForm.kind}
        value={kind}
        onChange={setKind}
        options={[
          { value: 'truth', label: t.dareForm.truth },
          { value: 'dare', label: t.dareForm.dare },
        ]}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.category} className="text-sm font-semibold text-muted">
          {t.dareForm.category}
        </label>
        <select
          id={ids.category}
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryId)}
          className="min-h-12 rounded-md border-[1.5px] border-line bg-bg px-3 text-base text-text"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {t.categories[c.id].name}
            </option>
          ))}
        </select>
      </div>
      {allowed.length > 1 ? (
        <Segmented
          label={t.dareForm.intensity}
          value={String(effectiveIntensity)}
          onChange={(v) => setIntensity(Number(v) as Intensity)}
          options={allowed.map((i) => ({ value: String(i), label: String(i) }))}
        />
      ) : null}
      <Toggle label={t.dareForm.remote} checked={remote} onChange={setRemote} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.text} className="text-sm font-semibold text-muted">
          {t.dareForm.text}
        </label>
        <textarea
          id={ids.text}
          rows={3}
          value={text}
          maxLength={400}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? ids.error : undefined}
          onChange={(e) => {
            setText(e.target.value)
            setError(null)
          }}
          className="resize-none rounded-md border-[1.5px] border-line bg-transparent p-3.5 text-base leading-relaxed text-text"
        />
        {error ? (
          <p id={ids.error} className="text-sm font-semibold text-dare">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit" className="flex-1">
          {t.common.save}
        </Button>
      </div>
    </form>
  )
}
