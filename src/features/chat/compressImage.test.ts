import { fitUnder } from './compressImage'

test('photos are re-encoded smaller and smaller until they fit under 1 MB', async () => {
  const sizes = [2_400_000, 1_300_000, 900_000]
  const encode = vi.fn(
    async () => new Blob([new Uint8Array(sizes.shift()!)], { type: 'image/jpeg' }),
  )
  const blob = await fitUnder(1024 * 1024, encode)
  expect(blob!.size).toBe(900_000)
  expect(encode.mock.calls.map((c) => c as unknown[])).toHaveLength(3)
})

test('gives up when even the smallest version is too big', async () => {
  const encode = async () => new Blob([new Uint8Array(2_000_000)], { type: 'image/jpeg' })
  expect(await fitUnder(1024 * 1024, encode)).toBeNull()
})
