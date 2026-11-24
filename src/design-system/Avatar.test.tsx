import { render, screen } from '@testing-library/react'
import { AVATARS } from '@/content/avatars'
import { Avatar } from './Avatar'

test('with an avatar id, shows the 3D avatar named after the player', () => {
  render(<Avatar name="Awa" avatarId={AVATARS[0]!.id} />)
  const img = screen.getByRole('img', { name: 'Awa' })
  expect(img.tagName).toBe('IMG')
})

test('without an avatar id, shows the initial', () => {
  render(<Avatar name="kofi" />)
  expect(screen.getByRole('img', { name: 'kofi' })).toHaveTextContent('K')
})

test('Axis shows his face, and moves his mouth while he talks', async () => {
  const { act } = await import('@testing-library/react')
  const { setAxisMood } = await import('@/features/bot/axisMood')
  const { axisFace } = await import('@/content/axis')
  vi.useFakeTimers()
  render(<Avatar name="Axis" avatarId="axis" />)
  const img = screen.getByRole('img', { name: 'Axis' }) as HTMLImageElement
  expect(img.getAttribute('src')).toBe(axisFace('happy'))
  act(() => setAxisMood('cheeky', { talk: true }))
  const seen = new Set<string>()
  for (let i = 0; i < 8; i++) {
    act(() => vi.advanceTimersByTime(200))
    seen.add(img.getAttribute('src')!)
  }
  expect(seen.size).toBeGreaterThan(1)
  act(() => vi.advanceTimersByTime(3000))
  expect(img.getAttribute('src')).toBe(axisFace('cheeky'))
  vi.useRealTimers()
})
