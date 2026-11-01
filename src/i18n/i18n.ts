// UI language: dictionaries, initial choice, `useI18n()`. The provider is in I18nProvider.tsx.
import { createContext, useContext } from 'react'
import type { it } from './it.ts'

export const languages = ['it', 'en', 'ja'] as const
export type Lang = (typeof languages)[number]

/** Each language named in itself, so a reader finds their own whatever the current language. */
export const languageNames: Record<Lang, string> = { it: 'Italiano', en: 'English', ja: '日本語' }

export type MessageKey = keyof typeof it
export type Messages = Record<MessageKey, string>
export type MessageParams = Record<string, string | number>

export interface I18n {
  lang: Lang
  setLang: (lang: Lang) => void
  /** The text of `key` in the current language, with `{name}` replaced by `params.name`. */
  t: (key: MessageKey, params?: MessageParams) => string
}

export const I18nContext = createContext<I18n | null>(null)

export function useI18n(): I18n {
  const i18n = useContext(I18nContext)
  if (!i18n) throw new Error('useI18n() must be used inside <I18nProvider>')
  return i18n
}

export function interpolate(text: string, params: MessageParams = {}): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}

const storageKey = 'travel-guide.lang'
const isLang = (value: unknown): value is Lang => languages.includes(value as Lang)

/** Saved choice, else the browser language when supported, else Italian. */
export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(storageKey)
    if (isLang(saved)) return saved
  } catch {
    // storage blocked (private mode, disabled cookies)
  }
  const browser = navigator.language.slice(0, 2).toLowerCase()
  return isLang(browser) ? browser : 'it'
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(storageKey, lang)
  } catch {
    // not saved: the choice lasts until reload
  }
}
