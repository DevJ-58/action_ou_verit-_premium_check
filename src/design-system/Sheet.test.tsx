import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet } from './Sheet'

test('an open sheet is a modal dialog titled by its title', () => {
  render(
    <Sheet open onClose={() => {}} title="Quitter la partie ?">
      contenu
    </Sheet>,
  )
  const dialog = screen.getByRole('dialog', { name: 'Quitter la partie ?' })
  expect(dialog).toHaveAttribute('aria-modal', 'true')
})

test('Escape closes the sheet exactly once', async () => {
  const onClose = vi.fn()
  render(
    <Sheet open onClose={onClose} title="Titre">
      <button type="button">Dedans</button>
    </Sheet>,
  )
  await userEvent.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('a closed sheet renders nothing', () => {
  render(
    <Sheet open={false} onClose={() => {}} title="Titre">
      contenu
    </Sheet>,
  )
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
