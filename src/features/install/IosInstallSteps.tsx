import { PlusSquare, Share } from 'lucide-react'
import { LogoMark } from '@/design-system'
import { useT } from '@/i18n/useT'

/** The three steps to add the app to the iPhone home screen. */
export function IosInstallSteps() {
  const t = useT()
  const steps = [
    { icon: <Share aria-hidden="true" size={22} />, text: t.install.iosStep1 },
    { icon: <PlusSquare aria-hidden="true" size={22} />, text: t.install.iosStep2 },
    { icon: <LogoMark size={26} />, text: t.install.iosStep3 },
  ]
  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3 rounded-[20px] border border-line p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-seat text-gold-text">
              {step.icon}
            </span>
            <span className="pt-1.5 font-semibold">
              <span className="mr-1.5 text-gold-text">{i + 1}.</span>
              {step.text}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted">{t.install.iosSafari}</p>
    </div>
  )
}
