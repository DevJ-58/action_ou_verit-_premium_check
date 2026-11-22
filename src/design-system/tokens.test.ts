import { describe, expect, test } from 'vitest'
import css from './tokens.css?raw'

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector)
  if (start === -1) throw new Error(`selector not found: ${selector}`)
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1]!, m[2]!]),
  )
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

const fixed = block(':root {')

describe.each(['nuit', 'ivoire', 'terre'])('theme %s', (theme) => {
  const t = { ...fixed, ...block(`[data-theme='${theme}']`) }
  test.each([
    ['text', 'bg'],
    ['muted', 'bg'],
    ['gold-text', 'bg'],
    ['on-gold', 'gold'],
  ])('%s on %s meets AA (4.5:1)', (fg, bg) => {
    expect(contrast(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(4.5)
  })
})

test.each([
  ['dare-ink', 'card-ivory'],
  ['ink', 'card-ivory'],
  ['ivory', 'truth'],
  ['ink', 'dare'],
])('fixed pair %s on %s meets AA (4.5:1)', (fg, bg) => {
  expect(contrast(fixed[fg]!, fixed[bg]!)).toBeGreaterThanOrEqual(4.5)
})
