import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LobbyView } from './LobbyView'
import { stateFor, proposing } from './roomTestKit'

test('the host’s lobby marks the code, categories, rounds and start for the guide', () => {
  const base = stateFor('a', proposing())
  const state = {
    ...base,
    role: 'host' as const,
    room: { ...base.room!, status: 'lobby' as const, game: null, hostId: 'a' },
  }
  render(
    <MemoryRouter>
      <LobbyView state={state} />
    </MemoryRouter>,
  )
  for (const target of ['room-code', 'categories', 'rounds', 'start-game']) {
    expect(document.querySelector(`[data-tour="${target}"]`), target).not.toBeNull()
  }
})
