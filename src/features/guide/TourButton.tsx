import { CircleHelp } from 'lucide-react'
import { IconButton } from '@/design-system'
import type { TourName } from '@/features/settings/settingsStore'
import { useT } from '@/i18n/useT'
import { startTour } from './tourStore'

/** “?” — shows this screen’s guide again. */
export function TourButton({ name, className }: { name: TourName; className?: string }) {
  const t = useT()
  return (
    <IconButton
      label={t.tour.help}
      icon={<CircleHelp size={20} />}
      className={className}
      onClick={() => startTour(name)}
    />
  )
}
