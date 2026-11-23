import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installStore } from './installStore'
import { InstallCard } from './InstallCard'

const ua = (value: string) =>
  Object.defineProperty(navigator, 'userAgent', { value, configurable: true })
const ANDROID = 'Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile'
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1'

beforeEach(() => {
  localStorage.clear()
  installStore.setState({ prompt: null, installed: false })
  ua(ANDROID)
})

test('when the browser can install, one tap opens its install prompt', async () => {
  const prompt = vi.fn().mockResolvedValue(undefined)
  act(() =>
    installStore.setState({
      prompt: { prompt, userChoice: Promise.resolve({ outcome: 'accepted' }) } as never,
    }),
  )
  render(<InstallCard />)
  await userEvent.click(screen.getByRole('button', { name: /installer l’appli/i }))
  expect(prompt).toHaveBeenCalled()
})

test('on iPhone, it explains how to add the app to the home screen', async () => {
  ua(IPHONE)
  render(<InstallCard />)
  await userEvent.click(screen.getByRole('button', { name: /installer l’appli/i }))
  expect(await screen.findByRole('dialog')).toHaveTextContent(/sur l’écran d’accueil/i)
})

test('nothing is shown when it cannot be installed, or after “Later”', async () => {
  const { unmount } = render(<InstallCard />)
  expect(screen.queryByRole('button', { name: /installer/i })).not.toBeInTheDocument()
  unmount()

  ua(IPHONE)
  const second = render(<InstallCard />)
  await userEvent.click(screen.getByRole('button', { name: /plus tard/i }))
  expect(screen.queryByRole('button', { name: /installer/i })).not.toBeInTheDocument()
  second.unmount()
  render(<InstallCard />)
  expect(screen.queryByRole('button', { name: /installer/i })).not.toBeInTheDocument()
})
