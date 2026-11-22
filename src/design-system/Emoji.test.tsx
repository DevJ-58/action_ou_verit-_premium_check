import { render, screen } from '@testing-library/react'
import { Emoji } from './Emoji'

test('an emoji is decorative by default', () => {
  const { container } = render(<Emoji name="fire" />)
  const img = container.querySelector('img')!
  expect(img).toHaveAttribute('alt', '')
  expect(img).toHaveAttribute('aria-hidden', 'true')
})

test('an emoji with a label is announced', () => {
  render(<Emoji name="party" label="Bravo" />)
  expect(screen.getByRole('img', { name: 'Bravo' })).toBeInTheDocument()
})
