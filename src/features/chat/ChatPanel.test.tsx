import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInMemoryBus } from '@/features/room/bus'
import { members } from '@/features/room/roomTestKit'
import { createChatStore } from './chatStore'
import { ChatPanel } from './ChatPanel'
import { createLocalChat } from './localChat'

beforeEach(() => localStorage.clear())

function setup() {
  const bus = createInMemoryBus()
  const store = createChatStore({ transport: createLocalChat(bus), code: 'ABCDEF', selfId: 'a' })
  render(<ChatPanel store={store} members={members} selfId="a" open onClose={() => {}} />)
  return store
}

test('typing a message and sending it shows it in the conversation', async () => {
  setup()
  await userEvent.type(screen.getByRole('textbox', { name: /^message$/i }), 'On commence ?{Enter}')
  const log = screen.getByRole('log')
  expect(await within(log).findByText('On commence ?')).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: /^message$/i })).toHaveValue('')
})

test('messages from others show who wrote them; voice notes can be played', async () => {
  const store = setup()
  const { act } = await import('@testing-library/react')
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
  expect(within(log).getByText('Prêt !')).toBeInTheDocument()
  expect(within(log).getByRole('button', { name: /écouter le vocal.*inès/i })).toBeInTheDocument()
})

test('a microphone button starts a voice note', () => {
  setup()
  expect(screen.getByRole('button', { name: /message vocal/i })).toBeInTheDocument()
})
