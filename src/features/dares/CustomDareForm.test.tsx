import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomDareForm } from './CustomDareForm'

test('a too short text is refused with a message', async () => {
  const onSave = vi.fn()
  render(<CustomDareForm onSave={onSave} onCancel={() => {}} />)
  await userEvent.type(screen.getByLabelText(/texte du défi/i), 'ab')
  await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
  expect(onSave).not.toHaveBeenCalled()
  expect(screen.getByText(/au moins 3 caractères/i)).toBeInTheDocument()
})

test('saves kind, category, intensity within range and modes', async () => {
  const onSave = vi.fn()
  render(<CustomDareForm onSave={onSave} onCancel={() => {}} />)
  await userEvent.click(screen.getByRole('radio', { name: 'Vérité' }))
  await userEvent.selectOptions(screen.getByLabelText(/catégorie/i), 'honest')
  await userEvent.click(screen.getByRole('radio', { name: '2' }))
  await userEvent.click(screen.getByRole('switch', { name: /jouable à distance/i }))
  await userEvent.type(screen.getByLabelText(/texte du défi/i), '  Ton pire mensonge ?  ')
  await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
  expect(onSave).toHaveBeenCalledWith({
    kind: 'truth',
    category: 'honest',
    intensity: 2,
    modes: ['nearby'],
    text: 'Ton pire mensonge ?',
  })
})

test('a category with a single intensity fixes it', async () => {
  const onSave = vi.fn()
  render(<CustomDareForm onSave={onSave} onCancel={() => {}} />)
  await userEvent.selectOptions(screen.getByLabelText(/catégorie/i), 'spicy')
  await userEvent.type(screen.getByLabelText(/texte du défi/i), 'Un clin d’œil appuyé')
  await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ category: 'spicy', intensity: 3 }))
})
