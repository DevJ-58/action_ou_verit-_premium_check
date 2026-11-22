import { useEffect } from 'react'
import { useSettings } from './settingsStore'

const THEME_COLOR = { nuit: '#0f0e1a', ivoire: '#f4ecdd', terre: '#3a1e14' } as const

/** Reflects the chosen theme and language on <html>. */
export function useApplySettings() {
  const theme = useSettings((s) => s.theme)
  const language = useSettings((s) => s.language)
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.lang = language
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme, language])
}
