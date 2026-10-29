// Today's date in the trip timezone (pure).

/** `YYYY-MM-DD` of `now` in an IANA timezone (`en-CA` formats dates as `YYYY-MM-DD`). */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
