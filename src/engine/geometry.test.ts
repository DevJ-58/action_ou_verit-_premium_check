import { askerIndexFor, cardRotationFor, computeSpin, seatAngle } from './geometry'

const norm = (deg: number) => ((deg % 360) + 360) % 360

describe('seatAngle', () => {
  test('places seats clockwise from the top', () => {
    expect(seatAngle(0, 4)).toBe(0)
    expect(seatAngle(1, 4)).toBe(90)
    expect(seatAngle(3, 4)).toBe(270)
  })

  test.each(Array.from({ length: 11 }, (_, i) => i + 2))(
    'gives %i distinct seats in [0, 360)',
    (n) => {
      const angles = Array.from({ length: n }, (_, i) => seatAngle(i, n))
      expect(new Set(angles).size).toBe(n)
      for (const a of angles) {
        expect(a).toBeGreaterThanOrEqual(0)
        expect(a).toBeLessThan(360)
      }
    },
  )
})

describe('computeSpin', () => {
  test('ends exactly on the target after whole extra turns', () => {
    const r = computeSpin(725, 90, 5)
    expect(r).toBeGreaterThan(725)
    expect(norm(r)).toBe(90)
    expect(r - 725).toBeGreaterThanOrEqual(5 * 360)
  })

  test('works from a negative or fractional rotation', () => {
    const r = computeSpin(-30.5, 200, 6)
    expect(norm(r)).toBeCloseTo(200)
    expect(r - -30.5).toBeGreaterThanOrEqual(6 * 360)
  })
})

describe('askerIndexFor', () => {
  test('picks the seat facing the answerer', () => {
    expect(askerIndexFor(0, 2)).toBe(1)
    expect(askerIndexFor(0, 4)).toBe(2)
  })

  test('on a tie, picks the next seat clockwise', () => {
    expect(askerIndexFor(0, 3)).toBe(1)
  })

  test.each(Array.from({ length: 11 }, (_, i) => i + 2))(
    'never returns the answerer (%i seats)',
    (n) => {
      for (let seat = 0; seat < n; seat++) {
        const asker = askerIndexFor(seat, n)
        expect(asker).not.toBe(seat)
        expect(asker).toBeGreaterThanOrEqual(0)
        expect(asker).toBeLessThan(n)
      }
    },
  )
})

describe('cardRotationFor', () => {
  test('turns the card to face the player at that seat', () => {
    expect(cardRotationFor(180)).toBe(0)
    expect(cardRotationFor(0)).toBe(180)
    expect(cardRotationFor(90)).toBe(270)
    expect(cardRotationFor(270)).toBe(90)
  })

  test('snaps to the nearest quarter turn', () => {
    expect(cardRotationFor(200)).toBe(0)
    expect(cardRotationFor(40)).toBe(180)
  })
})
