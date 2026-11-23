import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { accountStore } from '@/features/account/accountStore'
import { TrialNotice } from './TrialNotice'

const DAY = 86400e3
function signedIn(premiumUntil: string | null, premiumTrial: boolean) {
  act(() =>
    accountStore.setState({
      status: 'signedIn',
      session: {
        account: { id: 'u', email: 'u@example.com' },
        profile: {} as never,
        premiumUntil,
        premiumTrial,
      },
    }),
  )
  render(
    <MemoryRouter>
      <TrialNotice />
    </MemoryRouter>,
  )
}

beforeEach(() => localStorage.clear())

test('two days before the end of the trial, it reminds the player', () => {
  signedIn(new Date(Date.now() + 1.5 * DAY).toISOString(), true)
  expect(screen.getByRole('link', { name: /garde le premium/i })).toHaveAttribute(
    'href',
    '/premium',
  )
  expect(screen.getByText(/se termine dans 2 jour/i)).toBeInTheDocument()
})

test('after the trial, it says it is over; it can be closed for the day', async () => {
  signedIn(new Date(Date.now() - DAY).toISOString(), true)
  expect(screen.getByText(/essai premium est terminé/i)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /fermer/i }))
  expect(screen.queryByText(/essai premium est terminé/i)).not.toBeInTheDocument()
})

test('nothing early in the trial, nor for paying players', () => {
  signedIn(new Date(Date.now() + 6 * DAY).toISOString(), true)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

test('nothing for paying players', () => {
  signedIn(new Date(Date.now() + DAY).toISOString(), false)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})
