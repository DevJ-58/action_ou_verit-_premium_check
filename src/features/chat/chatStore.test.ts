import { createInMemoryBus } from '@/features/room/bus'
import { createChatStore } from './chatStore'
import { createLocalChat } from './localChat'

beforeEach(() => localStorage.clear())

const flush = async () => {
  for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0))
}

function room() {
  const bus = createInMemoryBus()
  const phone = (selfId: string) =>
    createChatStore({ transport: createLocalChat(bus), code: 'ABCDEF', selfId })
  return { bus, phone }
}

test('a text message reaches the other phones, with its sender', async () => {
  const { phone } = room()
  const awa = phone('awa')
  const kofi = phone('kofi')
  await awa.getState().connect()
  await kofi.getState().connect()
  expect(await awa.getState().sendText('  Salut tout le monde  ')).toBe(true)
  await flush()
  expect(kofi.getState().messages).toMatchObject([{ from: 'awa', text: 'Salut tout le monde' }])
  expect(awa.getState().messages).toHaveLength(1)
})

test('empty or too long messages are refused', async () => {
  const { phone } = room()
  const awa = phone('awa')
  await awa.getState().connect()
  expect(await awa.getState().sendText('   ')).toBe(false)
  expect(await awa.getState().sendText('x'.repeat(501))).toBe(false)
  expect(awa.getState().messages).toEqual([])
})

test('unread messages count while the chat is closed; opening it clears them', async () => {
  const { phone } = room()
  const awa = phone('awa')
  const kofi = phone('kofi')
  await awa.getState().connect()
  await kofi.getState().connect()
  await awa.getState().sendText('Un')
  await awa.getState().sendText('Deux')
  await flush()
  expect(kofi.getState().unread).toBe(2)
  expect(awa.getState().unread).toBe(0)
  kofi.getState().setOpen(true)
  expect(kofi.getState().unread).toBe(0)
  await awa.getState().sendText('Trois')
  await flush()
  expect(kofi.getState().unread).toBe(0)
})

test('a phone that arrives later reads the earlier messages', async () => {
  const { phone } = room()
  const awa = phone('awa')
  await awa.getState().connect()
  await awa.getState().sendText('Avant toi')
  await flush()
  const late = phone('ines')
  await late.getState().connect()
  expect(late.getState().messages.map((m) => m.text)).toEqual(['Avant toi'])
  expect(late.getState().unread).toBe(0)
})

test('a voice note is stored and sent; notes longer than 30 s are refused', async () => {
  const { phone } = room()
  const awa = phone('awa')
  const kofi = phone('kofi')
  await awa.getState().connect()
  await kofi.getState().connect()
  const blob = new Blob(['voice'], { type: 'audio/webm' })
  expect(await awa.getState().sendVoice(blob, 4200)).toBe(true)
  expect(await awa.getState().sendVoice(blob, 31_000)).toBe(false)
  await flush()
  const [note] = kofi.getState().messages
  expect(note).toMatchObject({ from: 'awa', voice: { ms: 4200 } })
  expect(await awa.getState().transport.voiceUrl(note!.voice!.path)).toMatch(/^data:audio\/webm/)
})

test('the same message delivered twice is shown once', async () => {
  const { phone, bus } = room()
  const kofi = phone('kofi')
  await kofi.getState().connect()
  const message = { id: 'm1', from: 'awa', text: 'Hey', at: 1 }
  bus.publish({ kind: 'chat', code: 'ABCDEF', message })
  bus.publish({ kind: 'chat', code: 'ABCDEF', message })
  await flush()
  expect(kofi.getState().messages).toHaveLength(1)
})
