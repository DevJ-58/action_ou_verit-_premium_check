import { render, screen } from '@testing-library/react'
import { TextField } from './TextField'

test('the error message is linked to the input', () => {
  render(<TextField label="Pseudo" error="Ce pseudo est déjà pris" />)
  const input = screen.getByLabelText('Pseudo')
  expect(input).toHaveAccessibleDescription('Ce pseudo est déjà pris')
  expect(input).toHaveAttribute('aria-invalid', 'true')
})
