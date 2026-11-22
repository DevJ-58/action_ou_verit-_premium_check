import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FlipCard } from './FlipCard'

test('only the visible face is exposed to screen readers', () => {
  const { rerender } = render(<FlipCard flipped={false} front={<p>Face</p>} back={<p>Dos</p>} />)
  expect(screen.getByText('Dos')).toBeVisible()
  expect(screen.getByText('Face').closest('[aria-hidden="true"]')).not.toBeNull()
  rerender(<FlipCard flipped front={<p>Face</p>} back={<p>Dos</p>} />)
  expect(screen.getByText('Dos').closest('[aria-hidden="true"]')).not.toBeNull()
  expect(screen.getByText('Face').closest('[aria-hidden="true"]')).toBeNull()
})

test('a card with onFlip is a button that flips on tap', async () => {
  const onFlip = vi.fn()
  render(
    <FlipCard
      flipped={false}
      label="Carte 1"
      onFlip={onFlip}
      front={<p>Face</p>}
      back={<p>Dos</p>}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Carte 1' }))
  expect(onFlip).toHaveBeenCalledTimes(1)
})
