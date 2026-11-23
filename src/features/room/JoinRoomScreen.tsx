import { lazy, Suspense, useState, type FormEvent } from 'react'
import { ScanLine } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button, Emoji, Screen, Sheet, TextField } from '@/design-system'
import { useT } from '@/i18n/useT'
import { joinActiveRoom } from './joinActiveRoom'
import { isRoomCode, normalizeRoomCode } from './roomCode'

const QrScanner = lazy(async () => ({ default: (await import('./QrScanner')).QrScanner }))

export function JoinRoomScreen() {
  const t = useT()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [scanning, setScanning] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    await join(code)
  }

  async function join(value: string) {
    const normalized = normalizeRoomCode(value)
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
        <Button size="lg" variant="truth" onClick={() => setScanning(true)}>
          <ScanLine aria-hidden="true" size={20} />
          {t.room.scan}
        </Button>
        <div className="flex items-center gap-3 text-sm font-bold text-muted uppercase">
          <span className="h-px flex-1 bg-line" />
          {t.room.or}
          <span className="h-px flex-1 bg-line" />
        </div>
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
      <Sheet open={scanning} onClose={() => setScanning(false)} title={t.room.scanTitle}>
        {scanning ? (
          <Suspense fallback={<div className="aspect-square rounded-[28px] bg-ink" />}>
            <QrScanner
              onCode={(scanned) => {
                setScanning(false)
                setCode(scanned)
                void join(scanned)
              }}
            />
          </Suspense>
        ) : null}
      </Sheet>
    </Screen>
  )
}
