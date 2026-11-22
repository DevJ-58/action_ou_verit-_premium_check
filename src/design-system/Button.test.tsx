import { render, screen } from '@testing-library/react'
import { Button } from './Button'

test('a loading button is disabled and busy', () => {
  render(<Button loading>Valider</Button>)
  const button = screen.getByRole('button', { name: /valider/i })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('aria-busy', 'true')
})

test('a button defaults to type="button" so it never submits forms by accident', () => {
  render(<Button>Ok</Button>)
  expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
})
