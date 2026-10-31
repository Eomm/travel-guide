// Light/dark theme: the user's choice, the theme in use and `useTheme()`. The provider is in ThemeProvider.tsx.
import { createContext, useContext } from 'react'

export const themes = ['light', 'dark'] as const
export type Theme = (typeof themes)[number]

/** 'system' follows the OS preference until the user picks a theme. */
export type ThemePreference = Theme | 'system'

export interface ThemeContextValue {
  /** The theme in use: the preference, or the OS one when the preference is 'system'. */
  theme: Theme
  /** The saved choice: 'system' while the user has not picked a theme. */
  preference: ThemePreference
  /** Save and apply a theme. */
  setPreference: (preference: ThemePreference) => void
  /** Apply the other theme and save the choice. */
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const theme = useContext(ThemeContext)
  if (!theme) throw new Error('useTheme() must be used inside <ThemeProvider>')
  return theme
}

const storageKey = 'travel-guide.theme'
const isTheme = (value: unknown): value is Theme => themes.includes(value as Theme)

/** Saved choice, else 'system' (the OS preference). */
export function initialPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(storageKey)
    if (isTheme(saved)) return saved
  } catch {
    // storage blocked (private mode, disabled cookies)
  }
  return 'system'
}

export function savePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(storageKey, preference)
  } catch {
    // not saved: the choice lasts until reload
  }
}
