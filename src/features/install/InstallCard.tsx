import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button, LogoMark, Sheet } from '@/design-system'
import { useT } from '@/i18n/useT'
import { safeStorage } from '@/lib/safeStorage'
import { IosInstallSteps } from './IosInstallSteps'
import { installStore, isIos, isStandalone, useInstall } from './installStore'

const LATER_KEY = 'av:install-later'
const LATER_MS = 7 * 24 * 3600 * 1000

function snoozed(): boolean {
  const at = Number(safeStorage.getItem(LATER_KEY) ?? 0)
  return Date.now() - at < LATER_MS
}

/** Invites to install the app: the browser's prompt, or the iPhone steps. */
export function InstallCard() {
  const t = useT()
  const prompt = useInstall((s) => s.prompt)
  const installed = useInstall((s) => s.installed)
  const [hidden, setHidden] = useState(snoozed)
  const [steps, setSteps] = useState(false)
  const ios = isIos()

  if (hidden || installed || isStandalone() || (!prompt && !ios)) return null

  async function install() {
    if (!prompt) return setSteps(true)
    await prompt.prompt()
    const choice = await prompt.userChoice.catch(() => null)
    installStore.setState({ prompt: null, installed: choice?.outcome === 'accepted' })
  }

  return (
    <section className="flex items-center gap-3.5 rounded-[24px] border-[1.5px] border-line bg-seat/60 p-3.5">
      <LogoMark size={48} className="shrink-0" />
      <div className="flex flex-1 flex-col gap-2">
        <div>
          <h2 className="font-extrabold">{t.install.title}</h2>
          <p className="text-sm text-muted">{t.install.body}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void install()} className="min-h-11 px-4 text-sm">
            <Download aria-hidden="true" size={16} />
            {t.install.cta}
          </Button>
          <button
            type="button"
            onClick={() => {
              safeStorage.setItem(LATER_KEY, String(Date.now()))
              setHidden(true)
            }}
            className="min-h-11 px-3 text-sm font-bold text-muted"
          >
            {t.install.later}
          </button>
        </div>
      </div>
      <Sheet open={steps} onClose={() => setSteps(false)} title={t.install.iosTitle}>
        <IosInstallSteps />
      </Sheet>
    </section>
  )
}
