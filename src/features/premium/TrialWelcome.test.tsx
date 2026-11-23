import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { accountStore } from '@/features/account/accountStore'
import { TrialWelcome } from './TrialWelcome'

function signedIn(id: string, premiumUntil: string | null, premiumTrial: boolean) {
  act(() =>
    accountStore.setState({
      status: 'signedIn',
      session: {
        account: { id, email: `${id}@x.com` },
        profile: {} as never,
        premiumUntil,
        premiumTrial,
      },
    }),
  )
}
const show = () =>
  render(
    <MemoryRouter>
      <TrialWelcome />
    </MemoryRouter>,
  )
const inDays = (d: number) => new Date(Date.now() + d * 86400e3).toISOString()

beforeEach(() => localStorage.clear())

test('an account on its free trial is congratulated once', async () => {
  signedIn('u1', inDays(7), true)
  const first = show()
  const dialog = screen.getByRole('dialog', { name: /félicitations/i })
  expect(dialog).toHaveTextContent(/accès au forfait premium, offert pendant 7 jours/i)
  expect(dialog).toHaveTextContent(/vidéo en direct/i)
  await userEvent.click(screen.getByRole('button', { name: /c’est parti/i }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  first.unmount()
  show()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('each account is congratulated, but not paying or expired ones', () => {
  signedIn('u1', inDays(7), true)
  localStorage.setItem('av:trial-welcome:u1', '1')
  signedIn('u2', inDays(5), true)
  const a = show()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  a.unmount()
  signedIn('u3', inDays(30), false)
  const b = show()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  b.unmount()
  signedIn('u4', inDays(-1), true)
  show()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
