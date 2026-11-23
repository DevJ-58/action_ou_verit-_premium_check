const MAX_SIDE = 1280

/** Shrinks a photo to at most 1280 px and re-encodes it as JPEG (keeps the original if it can't). */
export async function compressImage(
  file: Blob,
): Promise<{ blob: Blob; width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.82))
    return blob ? { blob, width, height } : { blob: file, width, height }
  } catch {
    return { blob: file, width: 0, height: 0 }
  }
}
