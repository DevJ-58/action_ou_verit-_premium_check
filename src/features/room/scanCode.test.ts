import { codeFromScan } from './scanCode'

test('reads the room code from an invitation link or a bare code', () => {
  expect(codeFromScan('https://action-verite.vercel.app/salon/9WPVT7')).toBe('9WPVT7')
  expect(codeFromScan('https://x.github.io/action_ou_verit-_premium_check/salon/abcdef?x=1')).toBe(
    'ABCDEF',
  )
  expect(codeFromScan(' 9wpvt7 ')).toBe('9WPVT7')
})

test('anything else is not a room', () => {
  expect(codeFromScan('https://example.com/menu')).toBeNull()
  expect(codeFromScan('BONJOUR TOUT LE MONDE')).toBeNull()
  expect(codeFromScan('https://x.app/salon/O0O0O0')).toBeNull()
})
