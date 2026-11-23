import { renderHook } from '@testing-library/react'
import * as speech from '@/lib/speech/readAloud'
import { inChallenge, proposing } from '@/features/room/roomTestKit'
import { useReadDare } from './useReadDare'

const withReader = (g: ReturnType<typeof inChallenge>, readAloud: 'off' | 'female' | 'male') => ({
  ...g,
  settings: { ...g.settings, readAloud },
})

test('the turned card is read once, with the chosen voice', () => {
  const read = vi.spyOn(speech, 'readAloud').mockImplementation(() => {})
  const g = withReader(inChallenge('truth'), 'male')
  const name = g.players.find((p) => p.id === g.turn!.answererId)!.name
  const { rerender } = renderHook(({ game }) => useReadDare(game), { initialProps: { game: g } })
  rerender({ game: { ...g } })
  expect(read).toHaveBeenCalledTimes(1)
  expect(read).toHaveBeenCalledWith(`Vérité pour ${name}. ${g.turn!.dare!.text}`, 'male')
  read.mockRestore()
})

test('nothing is read when the host turned reading off, nor before the card is turned', () => {
  const read = vi.spyOn(speech, 'readAloud').mockImplementation(() => {})
  renderHook(() => useReadDare(withReader(inChallenge('dare'), 'off')))
  renderHook(() => useReadDare(withReader(proposing(), 'female')))
  expect(read).not.toHaveBeenCalled()
  read.mockRestore()
})
