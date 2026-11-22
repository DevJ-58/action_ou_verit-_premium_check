import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Segmented } from './Segmented'

test('segmented control is a radiogroup that reports the chosen value', async () => {
  const onChange = vi.fn()
  render(
    <Segmented
      label="Minuteur"
      value="a"
      onChange={onChange}
      options={[
        { value: 'a', label: 'Aucun' },
        { value: 'b', label: '30 s' },
      ]}
    />,
  )
  expect(screen.getByRole('radiogroup', { name: 'Minuteur' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'Aucun' })).toBeChecked()
  await userEvent.click(screen.getByRole('radio', { name: '30 s' }))
  expect(onChange).toHaveBeenCalledWith('b')
})
