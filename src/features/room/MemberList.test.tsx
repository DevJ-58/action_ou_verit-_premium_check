import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axisMember } from '@/content/axis'
import { MemberList } from './MemberList'
import type { Member } from './types'

const awa: Member = {
  id: 'a',
  pseudo: 'Awa',
  avatarId: '1f981',
  limits: { excludedCategories: [], maxIntensity: 4 },
  customDares: [],
}

test('the host can seat Axis, the AI, in one tap', async () => {
  const onBot = vi.fn()
  render(
    <MemberList
      members={[awa]}
      hostId="a"
      selfId="a"
      online={new Set(['a'])}
      onBot={onBot}
      canAddBot
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: /ajouter axis/i }))
  expect(onBot).toHaveBeenCalledWith(true)
})

test('Axis is marked as an AI, can be taken out, and cannot be added as a friend', async () => {
  const onBot = vi.fn()
  render(
    <MemberList
      members={[awa, axisMember()]}
      hostId="a"
      selfId="a"
      online={new Set(['a', 'bot-axis'])}
      onBot={onBot}
      canAddBot={false}
    />,
  )
  const axis = screen.getAllByRole('listitem').find((li) => li.textContent?.includes('Axis'))!
  expect(within(axis).getByText('IA')).toBeInTheDocument()
  expect(within(axis).queryByRole('button', { name: /ami/i })).not.toBeInTheDocument()
  await userEvent.click(within(axis).getByRole('button', { name: /retirer axis/i }))
  expect(onBot).toHaveBeenCalledWith(false)
  expect(screen.queryByRole('button', { name: /ajouter axis/i })).not.toBeInTheDocument()
})

test('guests see Axis but cannot add or remove him', () => {
  render(<MemberList members={[awa, axisMember()]} hostId="a" selfId="b" online={new Set(['a'])} />)
  expect(
    screen.queryByRole('button', { name: /retirer axis|ajouter axis/i }),
  ).not.toBeInTheDocument()
})
