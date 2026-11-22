import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button, Emoji, Screen, TextField } from '@/design-system'
import { useT } from '@/i18n/useT'
import { joinActiveRoom } from './joinActiveRoom'
import { isRoomCode, normalizeRoomCode } from './roomCode'

export function JoinRoomScreen() {
  const t = useT()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeRoomCode(code)
    if (!isRoomCode(normalized)) return setError(t.room.errors.invalidCode)
    setBusy(true)
    const failure = await joinActiveRoom(normalized)
    setBusy(false)
    if (failure) return setError(t.room.errors[failure])
    navigate(`/salon/${normalized}`, { replace: true })
  }

  return (
    <Screen back={() => navigate('/')} backLabel={t.common.back}>
      <form
        onSubmit={submit}
        noValidate
        className="mx-auto flex w-full max-w-md flex-col gap-6 pt-8"
      >
        <Emoji name="link" size={56} />
        <h1 className="font-display text-[40px] leading-none">{t.room.joinTitle}</h1>
        <TextField
          label={t.room.codeLabel}
          value={code}
          error={error}
          maxLength={8}
          autoCapitalize="characters"
          autoComplete="off"
          className="text-center font-mono text-3xl tracking-[0.4em] uppercase"
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setError(undefined)
          }}
        />
        <Button type="submit" size="lg" loading={busy}>
          {t.room.joinButton}
        </Button>
      </form>
    </Screen>
  )
}
