import { render, screen } from '@testing-library/react'

test('the app boots on the age gate under its base path', async () => {
  window.history.replaceState(null, '', import.meta.env.BASE_URL)
  const { App } = await import('./App')
  render(<App />)
  expect(await screen.findByRole('main')).toBeInTheDocument()
})
