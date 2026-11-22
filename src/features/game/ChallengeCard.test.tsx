import { render, screen } from '@testing-library/react'
import { makeDare } from '@/engine/testing'
import { ChallengeCard } from './ChallengeCard'
import { dareTextSize } from './dareTextSize'

test('long texts get smaller, more so on a sideways card', () => {
  expect(dareTextSize(40, false)).toBe('text-[22px]')
  expect(dareTextSize(40, true)).toBe('text-[22px]')
  expect(dareTextSize(80, true)).toBe('text-[17px]')
  expect(dareTextSize(280, true)).toBe('text-[13px]')
  expect(dareTextSize(280, false)).toBe('text-[17px]')
})

test('a sideways card reserves its rotated footprint and keeps long text inside', () => {
  const text = 'a'.repeat(280)
  render(<ChallengeCard dare={makeDare('w', { text })} rotation={90} byline="Awa" />)
  const card = screen.getByRole('article')
  const frame = card.parentElement!
  expect(frame).toHaveAttribute('data-sideways', 'true')
  expect(screen.getByText(text)).toHaveClass('text-[13px]')
  expect(screen.getByText(text).className).toMatch(/overflow-y-auto/)
})
