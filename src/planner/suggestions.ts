// Values offered by the Planner fields while typing: the ones the browser knows, named in the UI language.
import { type Lang } from '../i18n/i18n.ts'
import { locale } from '../model/format.ts'

export interface Suggestion {
  value: string
  label?: string
}

const supported = (key: 'timeZone' | 'currency') => {
  try {
    return Intl.supportedValuesOf(key)
  } catch {
    // older browsers: free typing only
    return []
  }
}

/** IANA timezones, e.g. Asia/Tokyo. */
export const timezoneSuggestions = (): Suggestion[] => supported('timeZone').map((value) => ({ value }))

/** ISO 4217 codes with their name, e.g. JPY "Japanese Yen". */
export function currencySuggestions(lang: Lang): Suggestion[] {
  const names = new Intl.DisplayNames(locale(lang), { type: 'currency' })
  return supported('currency').map((value) => ({ value, label: names.of(value) }))
}

// The trip content language: a short list, any other tag can be typed.
const contentLanguages = ['it', 'en', 'ja', 'fr', 'de', 'es', 'pt', 'nl', 'zh', 'ko']

export function languageSuggestions(lang: Lang): Suggestion[] {
  const names = new Intl.DisplayNames(locale(lang), { type: 'language' })
  return contentLanguages.map((value) => ({ value, label: names.of(value) }))
}
