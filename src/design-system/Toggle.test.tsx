import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toggle } from './Toggle'

test('toggle is a switch reflecting and flipping its state', async () => {
  const onChange = vi.fn()
  render(<Toggle label="Sons" checked={false} onChange={onChange} />)
  const sw = screen.getByRole('switch', { name: 'Sons' })
  expect(sw).toHaveAttribute('aria-checked', 'false')
  await userEvent.click(sw)
  expect(onChange).toHaveBeenCalledWith(true)
})
