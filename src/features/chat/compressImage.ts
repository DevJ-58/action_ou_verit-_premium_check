import { PHOTO_MAX_BYTES } from './types'

/** Tries successive encodings (each smaller) until one fits under `maxBytes`. */
export async function fitUnder(
  maxBytes: number,
  encode: (step: number) => Promise<Blob | null>,
  steps = 5,
): Promise<Blob | null> {
  for (let step = 0; step < steps; step++) {
    const blob = await encode(step)
    if (blob && blob.size <= maxBytes) return blob
  }
  return null
}

// Each step: a smaller side and a lower JPEG quality.
const SIDES = [1600, 1280, 1024, 800, 640]
const QUALITIES = [0.85, 0.8, 0.75, 0.7, 0.6]

/**
 * Shrinks a photo so it weighs at most 1 MB (JPEG). Returns null if it cannot be read or
 * made small enough; a photo already under 1 MB that cannot be re-encoded is kept as is.
 */
export async function compressImage(
  file: Blob,
): Promise<{ blob: Blob; width: number; height: number } | null> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file.size <= PHOTO_MAX_BYTES ? { blob: file, width: 0, height: 0 } : null
  }
  let width = bitmap.width
  let height = bitmap.height
  const blob = await fitUnder(PHOTO_MAX_BYTES, async (step) => {
    const scale = Math.min(1, SIDES[step]! / Math.max(bitmap.width, bitmap.height))
    width = Math.round(bitmap.width * scale)
    height = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height)
    return new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', QUALITIES[step]))
  })
  return blob ? { blob, width, height } : null
}
