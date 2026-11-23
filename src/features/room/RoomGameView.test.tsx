import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { systemDares } from '@/content/systemDares'
import type { GameAction } from '@/engine'
import { accountStore } from '@/features/account/accountStore'
import { gameAt, notAnswerer, proposing, show, stateFor } from './roomTestKit'

test('a proposer writes a dare and sends it as their proposal', async () => {
  const g = proposing()
  const s = show(stateFor(notAnswerer(g), g))
  await userEvent.type(screen.getByLabelText(/ton défi pour/i), 'Imite un flamant rose')
  await userEvent.click(screen.getByRole('button', { name: /proposer/i }))
  expect(s.act).toHaveBeenCalledWith({
    type: 'PROPOSE',
    playerId: s.self.id,
    dare: expect.objectContaining({
      kind: 'dare',
      text: 'Imite un flamant rose',
      modes: ['remote'],
    }),
  })
})

test('“Inspire-moi” fills the text with a game dare the proposer can edit', async () => {
  const g = proposing()
  show(stateFor(notAnswerer(g), g))
  await userEvent.click(screen.getByRole('button', { name: /inspire-moi/i }))
  const text = (screen.getByLabelText(/ton défi pour/i) as HTMLTextAreaElement).value
  expect(systemDares.some((d) => d.text === text)).toBe(true)
})

test('the answerer waits while the others propose, seeing how many are ready', () => {
  const g = proposing()
  show(stateFor(g.turn!.answererId, g))
  expect(screen.getByText(/les autres te préparent un défi/i)).toBeInTheDocument()
  expect(screen.getByText('0 / 2')).toBeInTheDocument()
})

test('the answerer turns over one face-down card', async () => {
  const g = gameAt((g0) => {
    const others = g0.players.filter((p) => p.id !== g0.turn!.answererId)
    return [
      { type: 'CHOOSE_KIND', kind: 'dare' },
      ...others.map((p): GameAction => ({
        type: 'PROPOSE',
        playerId: p.id,
        dare: {
          id: 'x',
          kind: 'dare',
          category: 'fun',
          intensity: 1,
          modes: ['remote'],
          text: `Défi de ${p.name}`,
        },
      })),
      { type: 'CLOSE_PROPOSALS' },
    ]
  })
  const s = show(stateFor(g.turn!.answererId, g))
  const cards = screen.getAllByRole('button', { name: /carte \d/i })
  expect(cards).toHaveLength(2)
  await userEvent.click(cards[1]!)
  await waitFor(() => expect(s.act).toHaveBeenCalledWith({ type: 'PICK_PROPOSAL', index: 1 }))
})

test('in the challenge, everyone sees the card and its author; the answerer can say it is done', async () => {
  const g = gameAt(() => [{ type: 'CHOOSE_KIND', kind: 'dare' }, { type: 'CLOSE_PROPOSALS' }])
  show(stateFor(notAnswerer(g), g))
  expect(screen.getByRole('article')).toHaveTextContent(g.turn!.dare!.text)
  expect(screen.queryByRole('button', { name: /c’est fait/i })).not.toBeInTheDocument()
})

test('the answerer can complete the challenge once someone gave a verdict', async () => {
  const g0 = gameAt(() => [{ type: 'CHOOSE_KIND', kind: 'dare' }, { type: 'CLOSE_PROPOSALS' }])
  const g = { ...g0, turn: { ...g0.turn!, votes: { [notAnswerer(g0)]: true } } }
  const s = show(stateFor(g.turn.answererId, g))
  await userEvent.click(screen.getByRole('button', { name: /c’est fait/i }))
  expect(s.act).toHaveBeenCalledWith({ type: 'COMPLETE' })
})

test('reactions: tapping an emoji sends it, and others’ reactions float on screen', async () => {
  const g = proposing()
  const s = show(
    stateFor('a', g, {
      reactions: [{ id: 'r1', from: 'k', emoji: 'fire', at: Date.now() + 1000 }],
    }),
  )
  expect(screen.getByRole('img', { name: /kofi.*feu/i })).toBeInTheDocument()
  await userEvent.click(
    within(screen.getByRole('toolbar', { name: /réactions/i })).getAllByRole('button')[0]!,
  )
  expect(s.react).toHaveBeenCalled()
})

test('at the end, everyone sees the recap; the host can replay', async () => {
  const g = { ...proposing(), phase: 'finished' as const, turn: null }
  const s = show(stateFor('a', g))
  expect(
    screen.getByRole('heading', { name: /remporte la partie|classement/i }),
  ).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /rejouer/i }))
  expect(s.act).toHaveBeenCalledWith({ type: 'RESTART' })
})

test('the host can skip the turn of an answerer who went offline', async () => {
  const g = gameAt(() => [{ type: 'CHOOSE_KIND', kind: 'dare' }, { type: 'CLOSE_PROPOSALS' }])
  const answerer = g.turn!.answererId
  const host = g.players.find((p) => p.id !== answerer)!.id
  const state = stateFor(host, g)
  const s = show({
    ...state,
    role: 'host',
    room: { ...state.room!, hostId: host },
    online: new Set([host]),
  })
  await userEvent.click(screen.getByRole('button', { name: /passer le tour de/i }))
  expect(s.act).toHaveBeenCalledWith({ type: 'SKIP' })
})

test('a finished game is added to the player’s account stats', () => {
  const record = vi.spyOn(accountStore.getState(), 'recordGame').mockResolvedValue()
  const g = { ...proposing(), phase: 'finished' as const, turn: null }
  show(stateFor('k', g))
  expect(record).toHaveBeenCalledWith(g)
  record.mockRestore()
})

test('a phone that missed the end of the game still counts it once the next one starts', () => {
  const record = vi.spyOn(accountStore.getState(), 'recordGame').mockResolvedValue()
  const g = proposing()
  const last = { id: 'old-game', phase: 'finished' as const, scores: g.scores }
  const state = stateFor('k', g)
  show({ ...state, room: { ...state.room!, lastGame: last } })
  expect(record).toHaveBeenCalledWith(last)
  record.mockRestore()
})

test('the music plays during the game, but not while this player’s mic is on', async () => {
  const { music } = await import('@/lib/audio/music')
  const { settingsStore } = await import('@/features/settings/settingsStore')
  settingsStore.setState({ music: true })
  const start = vi.spyOn(music, 'start').mockImplementation(() => {})
  const g = proposing()
  const quiet = stateFor('k', g)
  const first = show({ ...quiet, room: { ...quiet.room!, voice: ['k'] } })
  expect(start).not.toHaveBeenCalled()
  void first
  cleanup()
  show(stateFor('k', g))
  expect(start).toHaveBeenCalled()
  start.mockRestore()
})

test('during the game, tapping a player at the table opens their profile', async () => {
  const g = gameAt(() => [])
  const viewer = await import('@/features/friends/profileViewer')
  viewer.closeProfile()
  show(stateFor('a', { ...g, phase: 'ready', turn: null }))
  await userEvent.click(screen.getByRole('button', { name: /voir le profil de kofi/i }))
  const { renderHook } = await import('@testing-library/react')
  expect(renderHook(() => viewer.useViewedProfile()).result.current).toBe('k')
})

test('at any moment, the players of the game are one tap away, with their profile', async () => {
  const viewer = await import('@/features/friends/profileViewer')
  viewer.closeProfile()
  show(stateFor('a', proposing()))
  await userEvent.click(screen.getByRole('button', { name: /joueurs de la partie/i }))
  const sheet = await screen.findByRole('dialog', { name: /joueurs de la partie/i })
  await userEvent.click(within(sheet).getByRole('button', { name: /voir le profil de inès/i }))
  const { renderHook } = await import('@testing-library/react')
  expect(renderHook(() => viewer.useViewedProfile()).result.current).toBe('i')
})
