/** Normalises an angle in degrees to [0, 360). */
export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/** Angle of a seat around the table, in degrees: 0 = top of the screen, clockwise. */
export function seatAngle(index: number, count: number): number {
  return (index * 360) / count
}

/**
 * Final bottle rotation: at least `extraTurns` full turns past `currentRotation`,
 * landing exactly on `targetAngle`.
 */
export function computeSpin(
  currentRotation: number,
  targetAngle: number,
  extraTurns: number,
): number {
  const base = currentRotation + extraTurns * 360
  return base + normalizeAngle(targetAngle - normalizeAngle(base))
}

function circularDistance(a: number, b: number): number {
  const d = normalizeAngle(a - b)
  return Math.min(d, 360 - d)
}

/**
 * The seat the bottle's base points at when its neck points at `answererIndex`:
 * the seat closest to the opposite angle; on a tie, the first one clockwise
 * from the answerer. Never the answerer.
 */
export function askerIndexFor(answererIndex: number, count: number): number {
  const opposite = seatAngle(answererIndex, count) + 180
  let best = (answererIndex + 1) % count
  let bestDistance = Infinity
  for (let step = 1; step < count; step++) {
    const seat = (answererIndex + step) % count
    const distance = circularDistance(seatAngle(seat, count), opposite)
    if (distance < bestDistance - 1e-9) {
      best = seat
      bestDistance = distance
    }
  }
  return best
}

/**
 * Rotation that makes a card readable by the player sitting at `seatAngleDeg`
 * (player at the bottom edge → 0, at the top → 180), snapped to a quarter turn.
 */
export function cardRotationFor(seatAngleDeg: number): 0 | 90 | 180 | 270 {
  const raw = normalizeAngle(seatAngleDeg + 180)
  return ((Math.round(raw / 90) % 4) * 90) as 0 | 90 | 180 | 270
}
