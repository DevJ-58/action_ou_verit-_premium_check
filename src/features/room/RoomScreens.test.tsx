import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { createSeededRng } from '@/engine'
import { accountStore } from '@/features/account/accountStore'
import { settingsStore } from '@/features/settings/settingsStore'
import { resetActiveRoom, setRoomTransport } from './activeRoom'
import { createInMemoryBus } from './bus'
import { createLocalTransport } from './localTransport'
import { createRoomStore } from './roomStore'

let bus: ReturnType<typeof createInMemoryBus>

beforeEach(async () => {
  bus = createInMemoryBus()
  setRoomTransport(createLocalTransport(bus))
  resetActiveRoom()
  act(() => settingsStore.getState().confirmAge())
  await act(() =>
    accountStore.getState().signUp(`p${Math.random()}@example.com`, 'motdepasse', 'Awa'),
  )
})

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

async function otherPhoneHosting() {
  const host = createRoomStore({
    transport: createLocalTransport(bus),
    self: {
      id: 'kofi',
      pseudo: 'Kofi',
      avatarId: '1f981',
      limits: { excludedCategories: [], maxIntensity: 4 },
      customDares: [],
    },
    rng: createSeededRng(9),
  })
  const code = await host.getState().createRoom()
  return { host, code }
}

test('home offers to create a room, join one, or play on this phone', async () => {
  renderAt('/')
  expect(await screen.findByRole('link', { name: /créer un salon/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /rejoindre/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /jouer sur ce téléphone/i })).toBeInTheDocument()
})

test('an unknown code shows a clear message', async () => {
  renderAt('/salon/rejoindre')
  await userEvent.type(await screen.findByLabelText(/code du salon/i), 'abcdef')
  await userEvent.click(screen.getByRole('button', { name: /^rejoindre$/i }))
  expect(await screen.findByText(/aucun salon avec ce code/i)).toBeInTheDocument()
})

test('a room link joins the room and waits for the host', async () => {
  const { host, code } = await otherPhoneHosting()
  renderAt(`/salon/${code}`)
  expect(await screen.findByText(/en attente de kofi/i)).toBeInTheDocument()
  await waitFor(() =>
    expect(host.getState().room!.members.map((m) => m.pseudo)).toEqual(['Kofi', 'Awa']),
  )
  expect(screen.queryByRole('button', { name: /lancer/i })).not.toBeInTheDocument()
})

test('the host creates a room, shares its code and can launch from 2 players', async () => {
  const router = renderAt('/salon/nouveau')
  await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/salon\/[A-Z2-9]{6}$/))
  const code = router.state.location.pathname.slice(-6)
  expect(await screen.findByText(code)).toBeInTheDocument()
  const launch = await screen.findByRole('button', { name: /lancer la partie/i })
  expect(launch).toBeDisabled()

  const guest = createRoomStore({
    transport: createLocalTransport(bus),
    self: {
      id: 'ines',
      pseudo: 'Inès',
      avatarId: '1f43c',
      limits: { excludedCategories: [], maxIntensity: 4 },
      customDares: [],
    },
    rng: createSeededRng(2),
  })
  await act(() => guest.getState().joinRoom(code))
  expect(await screen.findByText('Inès')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /juste pour rire/i }))
  await waitFor(() => expect(launch).toBeEnabled())
})
