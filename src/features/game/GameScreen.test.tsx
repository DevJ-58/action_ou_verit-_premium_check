import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { systemDares } from '@/content/systemDares'
import {
  cardRotationFor,
  createGame,
  createSeededRng,
  reduce,
  seatAngle,
  type GameAction,
  type GameSettings,
  type GameState,
} from '@/engine'
import { makeDare, makePlayer } from '@/engine/testing'
import { settingsStore } from '@/features/settings/settingsStore'
import { gameStore } from './gameStore'

const baseSettings: GameSettings = {
  mode: 'nearby',
  categories: ['fun'],
  source: 'both',
  rounds: 2,
  timerSeconds: 0,
  maxSkips: 3,
  picker: 'bottle',
}

function gameAt(
  actions: GameAction[],
  settings: Partial<GameSettings> = {},
  players = defaultPlayers(),
): GameState {
  const ctx = { rng: createSeededRng(3), systemDares }
  return actions.reduce(
    (state, action) => reduce(state, action, ctx),
    createGame({ id: 'g', settings: { ...baseSettings, ...settings }, players }),
  )
}

function defaultPlayers() {
  return ['Awa', 'Kofi', 'Inès'].map((name) =>
    makePlayer(name.toLowerCase(), {
      name,
      customDares: [
        makeDare(`${name}-d`, { authorId: name.toLowerCase(), text: `Défi de ${name}` }),
      ],
    }),
  )
}

function renderGame(game: GameState) {
  act(() => gameStore.setState({ game, error: null }))
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/partie'] })} />)
}

beforeEach(() => {
  // Reduced motion: the bottle lands instantly in tests.
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  act(() => settingsStore.setState({ ageConfirmedAt: '2026-01-01', sound: false, haptics: false }))
})

const nameOf = (game: GameState, id: string) => game.players.find((p) => p.id === id)!.name

test('a game reloaded mid-spin lands on the same player and asks Action or Vérité', async () => {
  const spinning = gameAt([{ type: 'SPIN' }])
  renderGame(spinning)
  const answerer = nameOf(spinning, spinning.turn!.answererId)
  expect(await screen.findByText(new RegExp(`${answerer}, tire ta carte`, 'i'))).toBeInTheDocument()
  expect(gameStore.getState().game!.phase).toBe('choosing')
  expect(gameStore.getState().game!.turn!.answererId).toBe(spinning.turn!.answererId)
})

test('spinning, choosing and asking flow through the store', async () => {
  renderGame(gameAt([]))
  await userEvent.click(await screen.findByRole('button', { name: /tourner la bouteille/i }))
  await userEvent.click(await screen.findByRole('button', { name: /^action$/i }))
  expect(gameStore.getState().game!.phase).toBe('asking')
  await userEvent.click(await screen.findByRole('button', { name: /défi du jeu/i }))
  expect(gameStore.getState().game!.phase).toBe('challenge')
})

test('with no dare left for these settings, the asker can write one or skip', async () => {
  const limited = defaultPlayers().map((p) => ({
    ...p,
    limits: { excludedCategories: ['fun' as const], maxIntensity: 4 as const },
  }))
  renderGame(
    gameAt(
      [
        { type: 'SPIN' },
        { type: 'SPIN_SETTLED' },
        { type: 'CHOOSE_KIND', kind: 'dare' },
        { type: 'PICK_SYSTEM' },
      ],
      {},
      limited,
    ),
  )
  expect(await screen.findByText(/plus de défis pour ces réglages/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /j’écris maintenant/i })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /^passer$/i }))
  expect(gameStore.getState().game!.phase).toBe('ready')
})

test('the asker sees “Un de mes défis” only with compatible custom dares', async () => {
  const asking = gameAt([
    { type: 'SPIN' },
    { type: 'SPIN_SETTLED' },
    { type: 'CHOOSE_KIND', kind: 'dare' },
  ])
  renderGame(asking)
  expect(await screen.findByRole('button', { name: /un de mes défis/i })).toBeInTheDocument()
})

test('“Un de mes défis” is hidden when the asker has none of that kind', async () => {
  renderGame(
    gameAt([{ type: 'SPIN' }, { type: 'SPIN_SETTLED' }, { type: 'CHOOSE_KIND', kind: 'truth' }]),
  )
  await screen.findByRole('button', { name: /défi du jeu/i })
  expect(screen.queryByRole('button', { name: /un de mes défis/i })).not.toBeInTheDocument()
})

test('the asker can write a dare on the spot', async () => {
  renderGame(
    gameAt([{ type: 'SPIN' }, { type: 'SPIN_SETTLED' }, { type: 'CHOOSE_KIND', kind: 'dare' }]),
  )
  await userEvent.click(await screen.findByRole('button', { name: /j’écris maintenant/i }))
  await userEvent.type(screen.getByLabelText(/ton défi pour/i), 'Imite un pingouin')
  await userEvent.click(screen.getByRole('button', { name: /envoyer/i }))
  expect(await screen.findByText('Imite un pingouin')).toBeInTheDocument()
})

test('the challenge card turns to face the answerer', async () => {
  const challenge = gameAt([
    { type: 'SPIN' },
    { type: 'SPIN_SETTLED' },
    { type: 'CHOOSE_KIND', kind: 'dare' },
    { type: 'PICK_SYSTEM' },
  ])
  renderGame(challenge)
  const index = challenge.players.findIndex((p) => p.id === challenge.turn!.answererId)
  const card = await screen.findByRole('article')
  expect(card).toHaveAttribute('data-rotation', String(cardRotationFor(seatAngle(index, 3))))
})

test('the timer announces when time is up without ending the turn', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  renderGame(
    gameAt(
      [
        { type: 'SPIN' },
        { type: 'SPIN_SETTLED' },
        { type: 'CHOOSE_KIND', kind: 'truth' },
        { type: 'PICK_SYSTEM' },
      ],
      { timerSeconds: 30 },
    ),
  )
  expect(await screen.findByRole('timer')).toBeInTheDocument()
  // Let React run the countdown's effect (scheduled on faked timers) before time flies.
  await act(async () => {
    vi.advanceTimersByTime(1_000)
  })
  await act(async () => {
    vi.advanceTimersByTime(31_000)
  })
  expect(screen.getByText(/temps écoulé/i)).toBeInTheDocument()
  expect(gameStore.getState().game!.phase).toBe('challenge')
  vi.useRealTimers()
})

test('skip is disabled once the player has no skips left', async () => {
  renderGame(
    gameAt(
      [
        { type: 'SPIN' },
        { type: 'SPIN_SETTLED' },
        { type: 'CHOOSE_KIND', kind: 'dare' },
        { type: 'PICK_SYSTEM' },
      ],
      { maxSkips: 0 },
    ),
  )
  expect(await screen.findByRole('button', { name: /passer/i })).toBeDisabled()
})

test('completing a challenge scores and returns to the bottle', async () => {
  renderGame(
    gameAt([
      { type: 'SPIN' },
      { type: 'SPIN_SETTLED' },
      { type: 'CHOOSE_KIND', kind: 'dare' },
      { type: 'PICK_SYSTEM' },
    ]),
  )
  await userEvent.click(await screen.findByRole('button', { name: /c’est fait/i }))
  expect(gameStore.getState().game!.phase).toBe('ready')
  expect(await screen.findByRole('button', { name: /tourner la bouteille/i })).toBeInTheDocument()
})

test('without a game, the table sends back home', async () => {
  act(() => gameStore.setState({ game: null, error: null }))
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/partie'] })} />)
  expect(await screen.findByRole('button', { name: /nouvelle partie/i })).toBeInTheDocument()
})
