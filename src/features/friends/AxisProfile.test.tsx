import { act, render, screen } from '@testing-library/react'
import { AXIS_ID } from '@/content/axis'
import { PublicProfileSheet } from './PublicProfileSheet'
import { closeProfile, openProfile } from './profileViewer'

test('Axis’s profile says he is the game’s AI, with no friend request', async () => {
  render(<PublicProfileSheet />)
  act(() => openProfile(AXIS_ID))
  const sheet = await screen.findByRole('dialog', { name: 'Axis' })
  expect(sheet).toHaveTextContent(/l’IA du jeu/i)
  expect(screen.queryByRole('button', { name: /ami/i })).not.toBeInTheDocument()
  act(() => closeProfile())
})
