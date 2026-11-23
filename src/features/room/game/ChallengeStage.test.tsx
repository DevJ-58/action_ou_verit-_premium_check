import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { GameState } from '@/engine'
import { inChallenge, notAnswerer, show, stateFor } from '../roomTestKit'

const withTurn = (g: GameState, over: Partial<NonNullable<GameState['turn']>>): GameState => ({
  ...g,
  turn: { ...g.turn!, ...over },
})

test('everyone sees who is answering and that no answer came yet', () => {
  const g = inChallenge('truth')
  show(stateFor(notAnswerer(g), g))
  const name = g.players.find((p) => p.id === g.turn!.answererId)!.name
  expect(screen.getByRole('status')).toHaveTextContent(new RegExp(`${name} réfléchit`, 'i'))
})

test('the answerer writes an answer and sends it to the room', async () => {
  const g = inChallenge('truth')
  const s = show(stateFor(g.turn!.answererId, g))
  await userEvent.type(screen.getByLabelText(/ta réponse/i), 'Oui, une fois')
  await userEvent.click(screen.getByRole('button', { name: /envoyer ma réponse/i }))
  expect(s.act).toHaveBeenCalledWith({
    type: 'ANSWER',
    playerId: g.turn!.answererId,
    text: 'Oui, une fois',
  })
})

test('once answered, everyone sees the answer and the status says so', () => {
  const g = withTurn(inChallenge('truth'), { answer: { text: 'Oui, une fois' } })
  show(stateFor(notAnswerer(g), g))
  expect(screen.getByRole('status')).toHaveTextContent(/a répondu/i)
  expect(screen.getByRole('blockquote')).toHaveTextContent('Oui, une fois')
})

test('the others vote on the answer; the answerer cannot vote', async () => {
  const g = withTurn(inChallenge('truth'), { answer: { text: 'Non' } })
  const voter = notAnswerer(g)
  const s = show(stateFor(voter, g))
  await userEvent.click(screen.getByRole('button', { name: /validé/i }))
  expect(s.act).toHaveBeenCalledWith({ type: 'VOTE', playerId: voter, ok: true })
})

test('the answerer sees the verdicts but has no vote buttons', () => {
  const g = inChallenge('truth')
  const voters = g.players.filter((p) => p.id !== g.turn!.answererId).map((p) => p.id)
  const answered = withTurn(g, {
    answer: { text: 'Non' },
    votes: { [voters[0]!]: true, [voters[1]!]: false },
  })
  show(stateFor(g.turn!.answererId, answered))
  expect(screen.queryByRole('button', { name: /validé/i })).not.toBeInTheDocument()
  expect(screen.getByText(/1 validé · 1 pas convaincu/i)).toBeInTheDocument()
})

test('for a dare, the answerer can describe how it went before finishing', async () => {
  const g = inChallenge('dare')
  show(stateFor(g.turn!.answererId, g))
  expect(screen.getByLabelText(/raconte|preuve/i)).toBeInTheDocument()
})
