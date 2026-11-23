import { renderHook } from '@testing-library/react'
import { useViewportVars } from './useViewportVars'

test('publishes the visible height and the keyboard height as CSS variables', () => {
  const listeners = new Map<string, () => void>()
  const vv = {
    height: 500,
    offsetTop: 0,
    addEventListener: (e: string, f: () => void) => listeners.set(e, f),
    removeEventListener: () => {},
  }
  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
  renderHook(() => useViewportVars())
  const root = document.documentElement.style
  expect(root.getPropertyValue('--vvh')).toBe('500px')
  expect(root.getPropertyValue('--kb')).toBe('300px')
  vv.height = 800
  listeners.get('resize')!()
  expect(root.getPropertyValue('--kb')).toBe('0px')
})
