// Semantic checks that JSON Schema can't express (schema/README.md, "Checks done by the build").
// Pure TypeScript: runs in Node (check:trips) and in the browser (edit mode).
// Rule 6 (relative files exist) needs the file system and lives in scripts/load-trips.ts.
import type { Accommodation, DayEnd, DayStart, Place, Trip } from './trip.gen.ts'
import { type HoursProblem, hoursProblem } from './hours.ts'
import { formatPath, type Issue } from './issues.ts'

export interface CheckResult {
  errors: Issue[]
  warnings: Issue[]
}

type Path = (string | number)[]

export function checkTrip(trip: Trip): CheckResult {
  const errors: Issue[] = []
  const warnings: Issue[] = []
  const error = (path: Path, message: string) => errors.push({ path: formatPath(path), message })
  const warn = (path: Path, message: string) => warnings.push({ path: formatPath(path), message })

  const { accommodations = [], transports = [], reservations = [] } = trip.logistics ?? {}
  const stops = trip.days.flatMap((day, d) => day.stops.map((stop, s) => ({ day, stop, path: ['days', d, 'stops', s] })))

  // 1. Unique ids within places, within all stops, within each logistics list.
  const checkUnique = (items: { id?: string; path: Path }[]) => {
    const seen = new Map<string, Path>()
    for (const { id, path } of items) {
      if (id === undefined) continue
      const first = seen.get(id)
      if (first) error([...path, 'id'], `duplicate id "${id}" (also used by ${formatPath(first)})`)
      else seen.set(id, path)
    }
  }
  const listed = <T extends { id?: string }>(items: T[], ...prefix: Path) =>
    items.map((item, i) => ({ id: item.id, path: [...prefix, i] }))
  checkUnique(listed(trip.places, 'places'))
  checkUnique(stops.map(({ stop, path }) => ({ id: stop.id, path })))
  checkUnique(listed(accommodations, 'logistics', 'accommodations'))
  checkUnique(listed(transports, 'logistics', 'transports'))
  checkUnique(listed(reservations, 'logistics', 'reservations'))

  // 2. References point to existing items.
  const places = new Map(trip.places.map((p) => [p.id, p]))
  const accommodationsById = new Map(accommodations.map((a) => [a.id, a]))
  const reservationsById = new Map(reservations.map((r) => [r.id, r]))
  const checkRef = (id: string | undefined, ids: Map<string, unknown>, path: Path, what: string) => {
    if (id !== undefined && !ids.has(id)) error(path, `no ${what} with id "${id}"`)
  }
  trip.days.forEach((day, d) => {
    checkRef(day.start?.placeId, places, ['days', d, 'start', 'placeId'], 'place')
    checkRef(day.start?.accommodationId, accommodationsById, ['days', d, 'start', 'accommodationId'], 'accommodation')
    checkRef(day.end?.placeId, places, ['days', d, 'end', 'placeId'], 'place')
    checkRef(day.end?.accommodationId, accommodationsById, ['days', d, 'end', 'accommodationId'], 'accommodation')
  })
  for (const { stop, path } of stops) {
    checkRef(stop.placeId, places, [...path, 'placeId'], 'place')
    checkRef(stop.bookedId, reservationsById, [...path, 'bookedId'], 'reservation')
  }
  accommodations.forEach((a, i) => checkRef(a.placeId, places, ['logistics', 'accommodations', i, 'placeId'], 'place'))
  reservations.forEach((r, i) => checkRef(r.placeId, places, ['logistics', 'reservations', i, 'placeId'], 'place'))

  // 3. A reservation is used by at most one stop, on its date and at its time.
  const bookedBy = new Map<string, Path>()
  for (const { day, stop, path } of stops) {
    const reservation = stop.bookedId === undefined ? undefined : reservationsById.get(stop.bookedId)
    if (!reservation) continue
    const other = bookedBy.get(reservation.id)
    if (other) error([...path, 'bookedId'], `reservation "${reservation.id}" is already used by ${formatPath(other)}`)
    else bookedBy.set(reservation.id, path)
    if (day.date !== reservation.date) {
      error([...path, 'bookedId'], `reservation "${reservation.id}" is on ${reservation.date}, not ${day.date}`)
    }
    if (reservation.time !== undefined && stop.time !== reservation.time) {
      error([...path, 'time'], `must be ${reservation.time}, the time of reservation "${reservation.id}"`)
    }
  }

  // 4. Day dates unique, in order, inside the trip dates.
  const { startDate, endDate } = trip.trip
  if (endDate < startDate) error(['trip', 'endDate'], `must not be before startDate (${startDate})`)
  trip.days.forEach((day, d) => {
    const path = ['days', d, 'date']
    const previous = trip.days[d - 1]?.date
    if (trip.days.findIndex((other) => other.date === day.date) < d) error(path, `duplicate day ${day.date}`)
    else if (previous !== undefined && day.date < previous) error(path, `must come after ${previous} (days in order)`)
    if (day.date < startDate || day.date > endDate) error(path, `must be within the trip dates ${startDate}..${endDate}`)
  })

  // 5. Stop times ascending within a day (equal times are allowed; stops without time are skipped),
  // and the end time not before the last stop time.
  trip.days.forEach((day, d) => {
    let previous: string | undefined
    day.stops.forEach((stop, s) => {
      if (stop.time === undefined) return
      if (previous !== undefined && stop.time < previous) {
        error(['days', d, 'stops', s, 'time'], `must not be before the previous stop (${previous})`)
      }
      previous = stop.time
    })
    if (day.end?.time !== undefined && previous !== undefined && day.end.time < previous) {
      error(['days', d, 'end', 'time'], `must not be before the last stop (${previous})`)
    }
  })

  // Warnings: opening hours, place status, coordinates.
  for (const { day, stop, path } of stops) {
    const place = stop.placeId === undefined ? undefined : places.get(stop.placeId)
    if (stop.placeId !== undefined && !place) continue // already an error
    if (place?.status && place.status !== 'open') warn(path, `place "${place.id}" is ${place.status}`)
    if (place?.openingHours) {
      const problem = hoursProblem(place.openingHours, day.date, stop.time, stop.durationMin)
      if (problem) warn(path, `place "${place.id}" ${describeProblem(problem, stop.durationMin)}`)
    }
    if (!hasCoords(place)) warn(path, 'no coordinates: the stop can not be shown on the map')
  }
  trip.days.forEach((day, d) => {
    if (day.start && !pointCoords(day.start, places, accommodationsById)) {
      warn(['days', d, 'start'], 'no coordinates: the start can not be shown on the map')
    }
    if (day.end && !pointCoords(day.end, places, accommodationsById)) {
      warn(['days', d, 'end'], 'no coordinates: the end can not be shown on the map')
    }
  })

  return { errors, warnings }
}

const hasCoords = (item?: { lat?: number; lng?: number }) => item?.lat !== undefined && item.lng !== undefined

// A missing reference counts as "has coordinates": it is reported as an error already.
function pointCoords(
  point: DayStart | DayEnd, places: Map<string, Place>, accommodations: Map<string, Accommodation>,
): boolean {
  if (hasCoords(point)) return true
  if (point.placeId !== undefined) return !places.has(point.placeId) || hasCoords(places.get(point.placeId))
  if (point.accommodationId !== undefined) {
    const accommodation = accommodations.get(point.accommodationId)
    if (!accommodation || hasCoords(accommodation)) return true
    return accommodation.placeId !== undefined && hasCoords(places.get(accommodation.placeId))
  }
  return false
}

function describeProblem(problem: HoursProblem, durationMin?: number): string {
  switch (problem.kind) {
    case 'closedDate': return `is closed on ${problem.date}`
    case 'closedDay': return `is closed on ${problem.day}`
    case 'closedAt': return `is closed at ${problem.time} on ${problem.day} (open ${problem.ranges.join(', ')})`
    case 'closesDuring':
      return `closes at ${problem.closes} on ${problem.day}, before the end of the stop (${problem.time} + ${durationMin} min)`
  }
}
