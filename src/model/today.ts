// Today's date in the trip timezone (pure).

/** `YYYY-MM-DD` of `now` in an IANA timezone (`en-CA` formats dates as `YYYY-MM-DD`). */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/**
 * Day to open by default (`dates`: the planned days, ascending): today if planned; during the trip
 * (`start`…`end`) on a day with no plan, the next planned day, else the last one before; before or
 * after the trip, the first day.
 */
export function defaultDay(dates: string[], start: string, end: string, today: string): string | undefined {
  if (dates.includes(today)) return today
  if (today < start || today > end) return dates[0]
  return dates.find((date) => date > today) ?? dates.filter((date) => date < today).at(-1)
}
