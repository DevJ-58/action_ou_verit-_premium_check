import { useState, type FormEvent } from 'react'
import { Button, TextField } from '@/design-system'
import { useT } from '@/i18n/useT'
import { validatePlayerName } from './validation'

export interface AddPlayerFormProps {
  existingNames: string[]
  onAdd(name: string): void
}

export function AddPlayerForm({ existingNames, onAdd }: AddPlayerFormProps) {
  const t = useT()
  const [name, setName] = useState('')
  const [error, setError] = useState<string>()

  function submit(event: FormEvent) {
    event.preventDefault()
    const result = validatePlayerName(name, existingNames)
    if (!result.ok) {
      setError(t.players.nameErrors[result.reason])
      return
    }
    onAdd(result.name)
    setName('')
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <TextField
        label={t.players.name}
        value={name}
        error={error}
        autoComplete="off"
        enterKeyHint="done"
        onChange={(e) => {
          setName(e.target.value)
          setError(undefined)
        }}
      />
      <Button type="submit" size="lg">
        {t.players.add}
      </Button>
    </form>
  )
}
