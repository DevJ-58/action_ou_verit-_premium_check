import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Button, Emoji, Screen, Segmented, TextField } from '@/design-system'
import { validatePlayerName } from '@/features/players/validation'
import { useT } from '@/i18n/useT'
import { accountStore } from './accountStore'

type Mode = 'signIn' | 'signUp'

export function AuthScreen() {
  const t = useT()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [mode, setMode] = useState<Mode>('signIn')
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [pseudoError, setPseudoError] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(undefined)
    let name = pseudo
    if (mode === 'signUp') {
      const result = validatePlayerName(pseudo, [])
      if (!result.ok) return setPseudoError(t.players.nameErrors[result.reason])
      name = result.name
    }
    setBusy(true)
    const store = accountStore.getState()
    const code =
      mode === 'signUp'
        ? await store.signUp(email, password, name)
        : await store.signIn(email, password)
    setBusy(false)
    if (code) return setError(t.account.errors[code])
    navigate(params.get('next') ?? '/profil', { replace: true })
  }

  return (
    <Screen back={() => navigate(-1)} backLabel={t.common.back}>
      <form
        onSubmit={submit}
        noValidate
        className="mx-auto flex w-full max-w-md flex-col gap-5 pt-6"
      >
        <Emoji name="wave" size={56} />
        <div>
          <h1 className="font-display text-[40px] leading-none">{t.account.title}</h1>
          <p className="mt-2 text-muted">{t.account.subtitle}</p>
        </div>
        <Segmented<Mode>
          label={t.account.title}
          value={mode}
          onChange={(m) => {
            setMode(m)
            setError(undefined)
          }}
          options={[
            { value: 'signIn', label: t.account.signIn },
            { value: 'signUp', label: t.account.signUp },
          ]}
        />
        {mode === 'signUp' ? (
          <TextField
            label={t.players.name}
            value={pseudo}
            error={pseudoError}
            autoComplete="nickname"
            onChange={(e) => {
              setPseudo(e.target.value)
              setPseudoError(undefined)
            }}
          />
        ) : null}
        <TextField
          label={t.account.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label={t.account.password}
          type="password"
          autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
          hint={mode === 'signUp' ? t.account.passwordHint : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? (
          <p role="alert" className="font-semibold text-dare">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" loading={busy}>
          {mode === 'signUp' ? t.account.submitSignUp : t.account.submitSignIn}
        </Button>
      </form>
    </Screen>
  )
}
