import { useEffect, useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/design-system'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'

/** Room code in big letters, a QR code to scan, and a share button. */
export function InviteCard({ code }: { code: string }) {
  const t = useT()
  const [qr, setQr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}${import.meta.env.BASE_URL}salon/${code}`

  useEffect(() => {
    let alive = true
    void import('qrcode')
      .then((QR) =>
        QR.toDataURL(link, { margin: 1, width: 360, color: { dark: '#0f0e1a', light: '#fffcf5' } }),
      )
      .then((url) => alive && setQr(url))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [link])

  async function share() {
    const text = format(t.room.shareText, { code })
    try {
      if (navigator.share) await navigator.share({ title: t.appName, text, url: link })
      else {
        await navigator.clipboard.writeText(`${text} — ${link}`)
        setCopied(true)
      }
    } catch {
      // Share sheet dismissed: nothing to do.
    }
  }

  return (
    <section className="flex flex-col items-center gap-4 rounded-[32px] border-[1.5px] border-gold p-6 text-center">
      <h2 className="text-xs font-extrabold tracking-[0.18em] text-gold-text uppercase">
        {t.room.shareTitle}
      </h2>
      <p className="font-mono text-[44px] font-bold tracking-[0.18em] tabular-nums">{code}</p>
      {qr ? <img src={qr} alt="" className="size-40 rounded-2xl" /> : <div className="size-40" />}
      <Button variant="ghost" onClick={share}>
        <Share2 aria-hidden="true" size={18} />
        {copied ? t.room.copied : t.room.share}
      </Button>
    </section>
  )
}
