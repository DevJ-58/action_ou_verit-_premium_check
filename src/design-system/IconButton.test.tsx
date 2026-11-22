import { render, screen } from '@testing-library/react'
import { IconButton } from './IconButton'

test('an icon button exposes its label as accessible name', () => {
  render(<IconButton label="Quitter la partie" icon={<svg />} />)
  expect(screen.getByRole('button', { name: 'Quitter la partie' })).toBeInTheDocument()
})
