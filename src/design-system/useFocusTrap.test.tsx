import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { useFocusTrap } from './useFocusTrap'

function Trap({ onEscape }: { onEscape(): void }) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, true, onEscape)
  return (
    <div ref={ref}>
      <button>ok</button>
    </div>
  )
}

test('Escape closes only the window opened last', async () => {
  const below = vi.fn()
  const above = vi.fn()
  render(
    <>
      <Trap onEscape={below} />
      <Trap onEscape={above} />
    </>,
  )
  await userEvent.keyboard('{Escape}')
  expect(above).toHaveBeenCalledOnce()
  expect(below).not.toHaveBeenCalled()
})
