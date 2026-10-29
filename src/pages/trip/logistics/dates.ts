// Date helpers for logistics: local dates (`YYYY-MM-DD`) and date-times (`YYYY-MM-DDTHH:MM`) as plain strings.
import { countDays } from '../../../model/format.ts'

/** The `YYYY-MM-DD` part of a local date or date-time. */
export const datePart = (value: string) => value.slice(0, 10)

/** Minutes since the epoch, reading the local value as if it were UTC (only differences are meaningful). */
function localMinutes(value: string): number {
  const [date, time = '00:00'] = value.split('T')
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return Date.UTC(year, month - 1, day, hours, minutes) / 60_000
}

/** Minutes from `start` to `end`; undefined when negative. Both must be in the same timezone. */
export function minutesBetween(start: string, end: string): number | undefined {
  const minutes = localMinutes(end) - localMinutes(start)
  return minutes >= 0 ? minutes : undefined
}

/** Nights between check-in and check-out (the times are ignored). */
export const countNights = (checkIn: string, checkOut: string) => countDays(datePart(checkIn), datePart(checkOut)) - 1

/** Sorts a copy of `items` by a chronological string key (ISO dates sort as strings); missing keys go last. */
export function byTime<T>(items: T[], key: (item: T) => string | undefined): T[] {
  return [...items].sort((a, b) => (key(a) ?? '￿').localeCompare(key(b) ?? '￿'))
}
