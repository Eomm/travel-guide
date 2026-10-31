// Machine-readable opening hours: is a place open for a stop? Shared by the build checks and the itinerary.
import type { OpeningHours } from './trip.gen.ts'

const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
type Weekday = (typeof weekdays)[number]

/** Day of the week of a YYYY-MM-DD date, independent of the local timezone. */
export function weekday(date: string): Weekday {
  const [y, m, d] = date.split('-').map(Number)
  return weekdays[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

const minutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** 26:00 → 02:00. */
const clockTime = (time: string) => {
  const [h, m] = time.split(':')
  return `${String(Number(h) % 24).padStart(2, '0')}:${m}`
}

export type HoursProblem =
  /** On one of `closedDates`. */
  | { kind: 'closedDate'; date: string }
  /** No `weekly` hours on that weekday. */
  | { kind: 'closedDay'; day: Weekday }
  /** The stop starts outside the hours of that day; `ranges` are the hours of the day. */
  | { kind: 'closedAt'; day: Weekday; time: string; ranges: string[] }
  /** The stop starts while open but ends after closing time (`closes`, HH:MM). */
  | { kind: 'closesDuring'; day: Weekday; time: string; closes: string }

/**
 * Why a place can't host a stop on `date` from `time` for `durationMin` minutes, or undefined when it is open
 * (or unknown: without `time` only `closedDates` is checked; free text `text` / `closures` are never checked).
 * With `weekly`, a missing weekday means closed; ranges ending past 24:00 (e.g. 17:00-26:00) also cover the early
 * hours of the next day.
 */
export function hoursProblem(
  hours: OpeningHours, date: string, time?: string, durationMin = 0,
): HoursProblem | undefined {
  if (hours.closedDates?.includes(date)) return { kind: 'closedDate', date }
  if (!hours.weekly || time === undefined) return undefined
  const day = weekday(date)
  const previousDay = weekdays[(weekdays.indexOf(day) + 6) % 7]
  const start = minutes(time)
  // the range holding the start, today or past midnight from the day before
  const holding = (ranges: string[] | undefined, at: number) =>
    (ranges ?? []).map((range) => range.split('-')).find(([from, to]) => minutes(from) <= at && at < minutes(to))
  const today = holding(hours.weekly[day], start)
  const yesterday = today ? undefined : holding(hours.weekly[previousDay], start + 24 * 60)
  const range = today ?? yesterday
  if (range) {
    const end = (yesterday ? start + 24 * 60 : start) + durationMin
    return end <= minutes(range[1]) ? undefined : { kind: 'closesDuring', day, time, closes: clockTime(range[1]) }
  }
  const ranges = hours.weekly[day] ?? []
  return ranges.length > 0 ? { kind: 'closedAt', day, time, ranges } : { kind: 'closedDay', day }
}
