import { useNavigate } from 'react-router'
import { Button, Screen } from '@/design-system'
import { pointsFor } from '@/engine'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { settingsStore } from '@/features/settings/settingsStore'

/** How to play, in five numbered steps. */
export function RulesScreen() {
  const t = useT()
  const navigate = useNavigate()
  return (
    <Screen title={t.rules.title} back={() => navigate(-1)} backLabel={t.common.back}>
      <div className="flex flex-col gap-6 pt-2 pb-10">
        <p className="text-muted">{t.rules.intro}</p>
        <ol aria-label={t.rules.stepsLabel} className="flex flex-col gap-4">
          {t.rules.sections.map((section, i) => (
            <li key={section.title} className="flex gap-4 rounded-[24px] border border-line p-5">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-gold font-extrabold text-on-gold"
              >
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-2">
                <h2 className="text-lg font-extrabold">{section.title}</h2>
                <ul className="flex list-disc flex-col gap-1.5 pl-4 text-sm leading-normal text-muted">
                  {section.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                {i === 3 ? (
                  <p className="rounded-2xl bg-seat px-3 py-2 text-sm font-bold">
                    {format(t.rules.points, {
                      truth: pointsFor('truth', 'done'),
                      dare: pointsFor('dare', 'done'),
                      skip: pointsFor('truth', 'skipped'),
                    })}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <Button
          size="lg"
          onClick={() => {
            settingsStore.getState().forgetTour('home')
            navigate('/')
          }}
        >
          {t.rules.startTour}
        </Button>
      </div>
    </Screen>
  )
}
