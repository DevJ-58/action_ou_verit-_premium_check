import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInMemoryBus } from '@/features/room/bus'
import { members } from '@/features/room/roomTestKit'
import { createChatStore } from './chatStore'
import { ChatPanel } from './ChatPanel'
import { createLocalChat } from './localChat'

beforeEach(() => localStorage.clear())

function setup(premiumLocked = false) {
  const bus = createInMemoryBus()
  const store = createChatStore({ transport: createLocalChat(bus), code: 'ABCDEF', selfId: 'a' })
  render(
    <ChatPanel
      store={store}
      members={members}
      selfId="a"
      open
      onClose={() => {}}
      premiumLocked={premiumLocked}
    />,
  )
  return store
}
const box = () => screen.getByRole('textbox', { name: /^message$/i })

test('one round button: the mic while empty, send as soon as there is text', async () => {
  setup()
  expect(screen.getByRole('button', { name: /message vocal/i })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /^envoyer$/i })).not.toBeInTheDocument()
  await userEvent.type(box(), 'Salut')
  expect(screen.getByRole('button', { name: /^envoyer$/i })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /message vocal/i })).not.toBeInTheDocument()
})

test('Enter sends, Shift+Enter goes to a new line', async () => {
  setup()
  await userEvent.type(box(), 'Ligne 1{Shift>}{Enter}{/Shift}Ligne 2')
  expect(box()).toHaveValue('Ligne 1\nLigne 2')
  await userEvent.type(box(), '{Enter}')
  expect(await within(screen.getByRole('log')).findByText(/Ligne 1/)).toBeInTheDocument()
  expect(box()).toHaveValue('')
})

test('messages from others show who wrote them; voice notes can be played', async () => {
  const store = setup()
  act(() =>
    store.setState({
      messages: [
        { id: '1', from: 'k', text: 'Prêt !', at: 1 },
        { id: '2', from: 'i', voice: { path: 'data:audio/webm;base64,AA', ms: 4000 }, at: 2 },
      ],
    }),
  )
  const log = screen.getByRole('log')
  expect(within(log).getByText('Kofi')).toBeInTheDocument()
  expect(within(log).getByRole('button', { name: /écouter le vocal.*inès/i })).toBeInTheDocument()
})

test('the photo button offers to take a photo or choose one', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: /envoyer une photo/i }))
  const menu = await screen.findByRole('dialog', { name: /envoyer une photo/i })
  expect(within(menu).getByLabelText(/prendre une photo/i)).toHaveAttribute(
    'capture',
    'environment',
  )
  expect(within(menu).getByLabelText(/choisir dans la galerie/i)).not.toHaveAttribute('capture')
})

test('a photo is previewed, then sent and shown in the conversation', async () => {
  setup()
  const file = new File(['img'], 'soiree.jpg', { type: 'image/jpeg' })
  await userEvent.click(screen.getByRole('button', { name: /envoyer une photo/i }))
  await userEvent.upload(await screen.findByLabelText(/choisir dans la galerie/i), file)
  const preview = await screen.findByRole('dialog', { name: /^photo$/i })
  await userEvent.click(within(preview).getByRole('button', { name: /envoyer la photo/i }))
  await waitFor(() =>
    expect(
      within(screen.getByRole('log')).getByRole('img', { name: /ma photo/i }),
    ).toBeInTheDocument(),
  )
})

test('without a Premium host, photo and voice buttons explain Premium instead', async () => {
  setup(true)
  await userEvent.click(screen.getByRole('button', { name: /message vocal/i }))
  expect(await screen.findByText(/l’hôte du salon soit premium/i)).toBeInTheDocument()
})
