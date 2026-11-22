import { safeStorage } from './safeStorage'

afterEach(() => vi.restoreAllMocks())

test('getItem returns null when localStorage throws', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('SecurityError')
  })
  expect(safeStorage.getItem('x')).toBeNull()
})

test('setItem does not throw when the quota is exceeded', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError')
  })
  expect(() => safeStorage.setItem('x', '1')).not.toThrow()
})

test('removeItem does not throw when storage is blocked', () => {
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(() => safeStorage.removeItem('x')).not.toThrow()
})

test('round-trips a value when storage works', () => {
  safeStorage.setItem('k', 'v')
  expect(safeStorage.getItem('k')).toBe('v')
})
