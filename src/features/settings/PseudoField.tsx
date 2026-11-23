import { useState } from 'react'
import { TextField } from '@/design-system'
import { PLAYER_NAME_MAX, validatePlayerName } from '@/features/players/validation'
import { useT } from '@/i18n/useT'

export interface PseudoFieldProps {
  value: string
  onSave(pseudo: string): void
}

/** The account nickname, saved when the field loses focus if it is valid. */
export function PseudoField({ value, onSave }: PseudoFieldProps) {
  const t = useT()
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | undefined>()
  return (
    <TextField
      label={t.settings.pseudo}
      value={draft}
      maxLength={PLAYER_NAME_MAX * 2}
      autoComplete="nickname"
      error={error}
      onChange={(e) => {
        setDraft(e.target.value)
        setError(undefined)
      }}
      onBlur={() => {
        const result = validatePlayerName(draft, [])
        if (!result.ok) return setError(t.players.nameErrors[result.reason])
        if (result.name !== value) onSave(result.name)
      }}
    />
  )
}
