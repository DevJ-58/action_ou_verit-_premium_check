import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { systemDares } from '@/content/systemDares'
import type { Dare, GameState } from '@/engine'
import { notAnswerer, proposing } from '../roomTestKit'
import { ProposalComposer } from './ProposalComposer'

const own = (over: Partial<Dare>): Dare => ({
  id: 'own-1',
  kind: 'dare',
  category: 'fun',
  intensity: 1,
  modes: ['nearby', 'remote'],
  text: 'Fais ta meilleure imitation de chèvre',
  authorId: 'me',
  ...over,
})

function compose(game: GameState, ownDares: Dare[] = []) {
  const onPropose = vi.fn()
  render(
    <ProposalComposer
      game={game}
      turn={game.turn!}
      selfId={notAnswerer(game)}
      ownDares={ownDares}
      onPropose={onPropose}
    />,
  )
  return onPropose
}

test('with prepared dares, “My dares” opens first and one tap proposes the dare as it is', async () => {
  const dare = own({})
  const onPropose = compose(proposing(), [
    dare,
    own({ id: 'own-2', kind: 'truth', text: 'Ta plus grande peur ?' }),
  ])
  expect(screen.getByRole('radio', { name: /mes défis/i })).toBeChecked()
  expect(screen.queryByText('Ta plus grande peur ?')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: `Choisir : ${dare.text}` }))
  expect(onPropose).toHaveBeenCalledWith(dare)
})

test('game dares of the right type and categories are one tap away', async () => {
  const game = proposing()
  const onPropose = compose(game)
  await userEvent.click(screen.getByRole('radio', { name: /^du jeu/i }))
  const buttons = screen.getAllByRole('button', { name: /^choisir :/i })
  expect(buttons.length).toBeGreaterThan(3)
  await userEvent.click(buttons[0]!)
  const sent = onPropose.mock.calls[0]![0] as Dare
  expect(sent.kind).toBe('dare')
  expect(game.settings.categories).toContain(sent.category)
  expect(systemDares.some((d) => d.text === sent.text)).toBe(true)
})

test('game dares beyond the answerer’s limits are not offered', async () => {
  const base = proposing()
  const answererId = base.turn!.answererId
  const game: GameState = {
    ...base,
    settings: { ...base.settings, categories: ['fun', 'spicy'] },
    players: base.players.map((p) =>
      p.id === answererId
        ? { ...p, limits: { excludedCategories: ['spicy'], maxIntensity: 4 } }
        : p,
    ),
  }
  compose(game)
  await userEvent.click(screen.getByRole('radio', { name: /^du jeu/i }))
  expect(screen.queryByRole('button', { name: /osé/i })).not.toBeInTheDocument()
})
