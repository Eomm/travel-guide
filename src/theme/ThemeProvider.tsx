import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  ThemeContext,
  initialPreference,
  savePreference,
  type Theme,
  type ThemeContextValue,
  type ThemePreference,
} from './theme.ts'

const darkQuery = '(prefers-color-scheme: dark)'

// the same query for the snapshot and for the subscription, so they never disagree
let media: MediaQueryList | undefined
function darkMedia() {
  media ??= window.matchMedia(darkQuery)
  return media
}

/** The theme of the OS, 'light' when the browser does not know it. */
function systemTheme(): Theme {
  return darkMedia().matches ? 'dark' : 'light'
}

/** Follows the OS preference while it changes. */
function subscribeSystemTheme(onChange: () => void) {
  const query = darkMedia()
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference)
  const system = useSyncExternalStore(subscribeSystemTheme, systemTheme)

  const theme = preference === 'system' ? system : preference

  // the stylesheet picks the theme from this attribute (see src/styles.css)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // keep the browser chrome (address bar, notch) in sync with the theme
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) return
    meta.setAttribute('content', getComputedStyle(document.body).backgroundColor)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      preference,
      setPreference: (next) => {
        savePreference(next)
        setPreferenceState(next)
      },
      toggle: () => {
        const next = theme === 'dark' ? 'light' : 'dark'
        savePreference(next)
        setPreferenceState(next)
      },
    }),
    [theme, preference],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
