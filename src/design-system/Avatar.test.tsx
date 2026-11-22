import { render, screen } from '@testing-library/react'
import { AVATARS } from '@/content/avatars'
import { Avatar } from './Avatar'

test('with an avatar id, shows the 3D avatar named after the player', () => {
  render(<Avatar name="Awa" avatarId={AVATARS[0]!.id} />)
  const img = screen.getByRole('img', { name: 'Awa' })
  expect(img.tagName).toBe('IMG')
})

test('without an avatar id, shows the initial', () => {
  render(<Avatar name="kofi" />)
  expect(screen.getByRole('img', { name: 'kofi' })).toHaveTextContent('K')
})
