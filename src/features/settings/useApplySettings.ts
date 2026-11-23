import { useEffect } from 'react'
import { usePremium } from '@/features/premium/usePremium'
import { PREMIUM_THEMES, useSettings } from './settingsStore'

const THEME_COLOR = {
  nuit: '#0f0e1a',
  ivoire: '#f4ecdd',
  terre: '#3a1e14',
  kente: '#0e2219',
  indigo: '#101734',
} as const

/** Reflects the chosen theme and language on <html> (a Premium theme falls back once Premium ends). */
export function useApplySettings() {
  const chosen = useSettings((s) => s.theme)
  const language = useSettings((s) => s.language)
  const premium = usePremium()
  const theme = PREMIUM_THEMES.includes(chosen) && !premium ? 'nuit' : chosen
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.lang = language
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme, language])
}
