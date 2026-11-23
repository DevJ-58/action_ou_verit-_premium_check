import { useAccount } from '@/features/account/accountStore'
import { isPremium } from './premium'

/** Whether the signed-in player is Premium right now. */
export function usePremium(): boolean {
  return isPremium(useAccount((s) => s.session?.premiumUntil))
}
