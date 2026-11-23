import { spinTickTimes } from './spinTicks'

test('the bottle ticks fast at first, then slower and slower until it stops', () => {
  const times = spinTickTimes(4000)
  expect(times.length).toBeGreaterThan(20)
  expect(times.at(-1)!).toBeLessThanOrEqual(4000)
  const gaps = times.slice(1).map((t, i) => t - times[i]!)
  expect(gaps[0]!).toBeLessThan(80)
  expect(gaps.at(-1)!).toBeGreaterThan(200)
  for (let i = 1; i < gaps.length; i++) expect(gaps[i]!).toBeGreaterThanOrEqual(gaps[i - 1]! - 1)
})
