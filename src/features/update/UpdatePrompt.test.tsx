import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpdatePrompt } from './UpdatePrompt'

const notes = ['Vidéo en direct pendant les défis', 'Ajoute tes amis et invite-les']

test('announces the new version with what is new, and applies it on request', async () => {
  const onUpdate = vi.fn()
  render(<UpdatePrompt notes={notes} onUpdate={onUpdate} onLater={() => {}} />)
  const prompt = screen.getByRole('alertdialog', { name: /nouvelle version/i })
  expect(prompt).toHaveTextContent('Vidéo en direct pendant les défis')
  await userEvent.click(screen.getByRole('button', { name: /mettre à jour/i }))
  expect(onUpdate).toHaveBeenCalled()
})

test('can be put off, and works without notes', async () => {
  const onLater = vi.fn()
  render(<UpdatePrompt notes={[]} onUpdate={() => {}} onLater={onLater} />)
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /plus tard/i }))
  expect(onLater).toHaveBeenCalled()
})
