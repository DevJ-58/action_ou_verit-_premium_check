import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tour } from './Tour'
import type { TourStep } from './tours'

const steps: TourStep[] = [
  { target: 'a', title: 'Premier', text: 'Le premier élément' },
  { target: 'missing', title: 'Absent', text: 'Pas à l’écran' },
  { target: 'b', title: 'Second', text: 'Le second élément' },
]

function page(onClose = vi.fn()) {
  render(
    <>
      <button data-tour="a">A</button>
      <button data-tour="b">B</button>
      <Tour steps={steps} onClose={onClose} />
    </>,
  )
  return onClose
}

test('shows the first present step and counts only the steps on screen', async () => {
  page()
  const bubble = await screen.findByRole('dialog', { name: 'Premier' })
  expect(bubble).toHaveTextContent('Le premier élément')
  expect(bubble).toHaveTextContent('1 / 2')
})

test('Suivant skips missing targets; the last button reads Terminer and closes', async () => {
  const onClose = page()
  await userEvent.click(await screen.findByRole('button', { name: 'Suivant' }))
  expect(screen.getByRole('dialog', { name: 'Second' })).toHaveTextContent('2 / 2')
  await userEvent.click(screen.getByRole('button', { name: 'Terminer' }))
  expect(onClose).toHaveBeenCalledOnce()
})

test('Passer and Escape close the guide', async () => {
  const onClose = page()
  await userEvent.click(await screen.findByRole('button', { name: 'Passer' }))
  await userEvent.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledTimes(2)
})

test('with no target on screen, the guide closes at once', async () => {
  const onClose = vi.fn()
  render(<Tour steps={[steps[1]!]} onClose={onClose} />)
  await waitFor(() => expect(onClose).toHaveBeenCalled())
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('the guide follows a target that moves away: it goes on to the next one', async () => {
  const onClose = vi.fn()
  const { rerender } = render(
    <>
      <button data-tour="a">A</button>
      <button data-tour="b">B</button>
      <Tour steps={steps} onClose={onClose} />
    </>,
  )
  await screen.findByRole('dialog', { name: 'Premier' })
  rerender(
    <>
      <button data-tour="b">B</button>
      <Tour steps={steps} onClose={onClose} />
    </>,
  )
  window.dispatchEvent(new Event('resize'))
  expect(await screen.findByRole('dialog', { name: 'Second' })).toBeInTheDocument()
})
