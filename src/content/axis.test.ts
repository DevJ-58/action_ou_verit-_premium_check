import { AXIS_ID, axisFace, axisMember, isBot } from './axis'

test('Axis is a room member with his own id, face and no custom dares', () => {
  const axis = axisMember()
  expect(axis).toMatchObject({ id: AXIS_ID, pseudo: 'Axis', avatarId: 'axis', customDares: [] })
  expect(isBot(AXIS_ID)).toBe(true)
  expect(isBot('a8d0c5c2-0000-4000-8000-000000000000')).toBe(false)
})

test('each mood has its own face', () => {
  const faces = new Set(
    (['happy', 'talking', 'calm', 'cheeky', 'doubt', 'laugh'] as const).map(axisFace),
  )
  expect(faces.size).toBe(6)
})
