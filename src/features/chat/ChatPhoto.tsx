import { useEffect, useState } from 'react'

export interface ChatPhotoProps {
  path: string
  width: number
  height: number
  alt: string
  resolve(path: string): Promise<string>
}

/** A photo in a chat bubble; its private address is resolved (signed) when shown. */
export function ChatPhoto({ path, width, height, alt, resolve }: ChatPhotoProps) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    void resolve(path)
      .then((u) => alive && setUrl(u))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [path, resolve])
  const ratio = width > 0 && height > 0 ? `${width} / ${height}` : '4 / 3'
  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="my-0.5 block w-56 max-w-full overflow-hidden rounded-[14px] bg-ink/30"
      style={{ aspectRatio: ratio }}
    >
      {url ? (
        <img src={url} alt={alt} className="size-full object-cover" />
      ) : (
        <span role="img" aria-label={alt} className="block size-full motion-safe:animate-pulse" />
      )}
    </a>
  )
}
