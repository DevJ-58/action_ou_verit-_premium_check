import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { members, proposing, stateFor } from '@/features/room/roomTestKit'
import type { RoomStoreState } from '@/features/room/roomStore'
import { VoiceButton } from './VoiceButton'
import { VoiceStrip } from './VoiceStrip'

function premiumState(selfId: string, voice: string[] = [], hostPremium = true): RoomStoreState {
  const s = stateFor(selfId, proposing())
  return {
    ...s,
    room: {
      ...s.room!,
      voice,
      members: s.room!.members.map((m) => (m.id === 'a' ? { ...m, premium: hostPremium } : m)),
    },
  }
}

test('in a Premium room, the mic button turns the live mic on, then off', async () => {
  const off = premiumState('k')
  const { unmount } = render(<VoiceButton state={off} />)
  await userEvent.click(screen.getByRole('button', { name: /activer mon micro/i }))
  expect(off.setVoice).toHaveBeenCalledWith(true)
  unmount()
  const on = premiumState('k', ['k'])
  render(<VoiceButton state={on} />)
  await userEvent.click(screen.getByRole('button', { name: /couper mon micro/i }))
  expect(on.setVoice).toHaveBeenCalledWith(false)
})

test('without a Premium host, the mic button explains Premium', async () => {
  const s = premiumState('k', [], false)
  render(<VoiceButton state={s} />)
  await userEvent.click(screen.getByRole('button', { name: /activer mon micro/i }))
  expect(s.setVoice).not.toHaveBeenCalled()
  expect(await screen.findByText(/micro en direct fait partie du premium/i)).toBeInTheDocument()
})

test('everyone sees who has their mic on, and with which voice', () => {
  render(<VoiceStrip members={members} talking={['k', 'a']} selfId="a" />)
  const strip = screen.getByRole('list', { name: /micros ouverts/i })
  expect(strip).toHaveTextContent('Kofi')
  expect(strip).toHaveTextContent('Monstre')
})
