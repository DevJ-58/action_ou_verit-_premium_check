import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { accountStore } from '@/features/account/accountStore'
import { settingsStore } from '@/features/settings/settingsStore'
import { setPaymentService } from './getPaymentService'
import { createLocalPayments } from './localPayments'
import type { PaymentService } from './payments'

const renderAt = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(async () => {
  act(() => settingsStore.getState().confirmAge())
  await act(() => accountStore.getState().signOut())
  setPaymentService(createLocalPayments())
})

test('signed out, the Premium page lists what it unlocks and asks to sign in', async () => {
  renderAt('/premium')
  expect(await screen.findByRole('heading', { name: /passe premium/i })).toBeInTheDocument()
  expect(screen.getByText(/vidéo en direct pour voir les actions/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /payer 300 fcfa/i })).toBeDisabled()
  expect(screen.getByRole('button', { name: /payer 1\s?500 fcfa/i })).toBeDisabled()
  expect(
    screen.getByRole('link', { name: /connecte-toi pour passer premium/i }),
  ).toBeInTheDocument()
})

describe('signed in', () => {
  beforeEach(async () => {
    await act(() =>
      accountStore.getState().signUp(`pr-${Date.now()}@example.com`, 'motdepasse', 'Awa'),
    )
  })

  test('buying the evening pass (test payment) makes the player Premium', async () => {
    renderAt('/premium')
    await userEvent.click(await screen.findByRole('button', { name: /payer 300 fcfa/i }))
    expect(await screen.findByText(/tu es premium jusqu’au/i)).toBeInTheDocument()
  })

  test('with a real payment, the player is sent to the payment page', async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    const redirect: PaymentService = {
      checkout: async () => ({ kind: 'redirect', url: 'https://checkout.cinetpay.com/payment/x' }),
    }
    setPaymentService(redirect)
    renderAt('/premium')
    await userEvent.click(await screen.findByRole('button', { name: /payer 1\s?500 fcfa/i }))
    expect(assign).toHaveBeenCalledWith('https://checkout.cinetpay.com/payment/x')
    vi.unstubAllGlobals()
  })

  test('when payment is not open yet, it says so', async () => {
    setPaymentService({ checkout: async () => ({ kind: 'unavailable' }) })
    renderAt('/premium')
    await userEvent.click(await screen.findByRole('button', { name: /payer 300 fcfa/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/pas encore ouvert/i)
  })

  test('back from the payment page, the thank-you screen confirms once the server has', async () => {
    renderAt('/premium/merci')
    expect(await screen.findByText(/on vérifie ton paiement/i)).toBeInTheDocument()
    await createLocalPayments().checkout('month')
    expect(
      await screen.findByText(/c’est bon, tu es premium/i, {}, { timeout: 4000 }),
    ).toBeInTheDocument()
  })
})
