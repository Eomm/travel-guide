// Pure formatting helpers for dates, prices and durations in the UI language.
import type { Lang } from '../i18n/i18n.ts'
import type { TripSettings } from './trip.gen.ts'

const locales: Record<Lang, string> = { it: 'it-IT', en: 'en-GB' }
export const locale = (lang: Lang) => locales[lang]

/** `YYYY-MM-DD` as a UTC midnight Date: format it with `timeZone: 'UTC'` to avoid day shifts. */
function utcDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

const dateStyles = {
  /** sab 10 apr */
  short: { weekday: 'short', day: 'numeric', month: 'short' },
  /** 10 apr 2027 */
  medium: { day: 'numeric', month: 'short', year: 'numeric' },
  /** sabato 10 aprile 2027 */
  long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  /** 10 apr */
  dayMonth: { day: 'numeric', month: 'short' },
} satisfies Record<string, Intl.DateTimeFormatOptions>

export type DateStyle = keyof typeof dateStyles

const dateFormat = (lang: Lang, style: DateStyle) =>
  new Intl.DateTimeFormat(locale(lang), { ...dateStyles[style], timeZone: 'UTC' })

export function formatDate(date: string, lang: Lang, style: DateStyle = 'medium'): string {
  return dateFormat(lang, style).format(utcDate(date))
}

/** `10–11 apr 2027`, `30 apr – 2 mag 2027`, `30 dic 2026 – 2 gen 2027`. */
export function formatDateRange(start: string, end: string, lang: Lang): string {
  if (start === end) return formatDate(start, lang)
  if (start.slice(0, 7) === end.slice(0, 7)) return dateFormat(lang, 'medium').formatRange(utcDate(start), utcDate(end))
  const sameYear = start.slice(0, 4) === end.slice(0, 4)
  return `${formatDate(start, lang, sameYear ? 'dayMonth' : 'medium')} – ${formatDate(end, lang)}`
}

/** Number of days from `start` to `end`, both included. */
export function countDays(start: string, end: string): number {
  return Math.round((utcDate(end).getTime() - utcDate(start).getTime()) / 86_400_000) + 1
}

function formatMoney(amount: number, currency: string, lang: Lang, maximumFractionDigits?: number): string {
  return new Intl.NumberFormat(locale(lang), {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol', // ¥ instead of JPY / JP¥
    useGrouping: true, // 1.700 also in Italian (the default groups from 10.000)
    minimumFractionDigits: maximumFractionDigits === undefined ? undefined : 0,
    maximumFractionDigits,
  }).format(amount)
}

export interface FormattedPrice {
  /** In the trip currency: `1.700 ¥`. */
  main: string
  /** In `convertCurrency`, when set and the amount is not 0: `≈ 10 €`. */
  converted?: string
}

/** A price of the trip (in `settings.currency`) with its rough conversion. */
export function formatPrice(amount: number, settings: TripSettings, lang: Lang): FormattedPrice {
  const main = formatMoney(amount, settings.currency, lang)
  const convert = settings.convertCurrency
  if (!convert || amount === 0) return { main }
  const value = amount / convert.oneEquals
  // whole units from 10 up, else one decimal
  return { main, converted: `≈ ${formatMoney(value, convert.currency, lang, Math.abs(value) >= 10 ? 0 : 1)}` }
}

/** `2 h 30 min`, `45 min`, `2 h`. */
export function formatDuration(minutes: number, lang: Lang): string {
  const number = new Intl.NumberFormat(locale(lang))
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  const parts = [hours > 0 && `${number.format(hours)} h`, (rest > 0 || hours === 0) && `${number.format(rest)} min`]
  return parts.filter(Boolean).join(' ')
}

/** A local date (`YYYY-MM-DD`) or date-time (`YYYY-MM-DDTHH:MM`), with no timezone shift: `sab 10 apr, 15:00`. */
export function formatLocalDateTime(value: string, lang: Lang, style: DateStyle = 'short'): string {
  const [date, time] = value.split('T')
  if (!time) return formatDate(date, lang, style)
  const [hours, minutes] = time.split(':').map(Number)
  const instant = new Date(utcDate(date).getTime() + (hours * 60 + minutes) * 60_000)
  const format = new Intl.DateTimeFormat(locale(lang), {
    ...dateStyles[style],
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  })
  return format.format(instant)
}
