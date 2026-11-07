// Pure changes to a trip, used by the Planner: each returns new objects and leaves the given ones untouched.
import type { Accommodation, Day, DayEnd, DayStart, Place, Reservation, Stop, Transport, Trip } from './trip.gen.ts'

/** A cleared field leaves the object instead of staying as `key: undefined`. */
export function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T
}

/** `object` with `key` set to `value`, or without `key` when `value` is undefined. */
export const setField = <T extends object, K extends keyof T>(object: T, key: K, value: T[K] | undefined): T =>
  withoutUndefined({ ...object, [key]: value })

/** The ISO date `days` days after `date` (YYYY-MM-DD). */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/** An id from `name` (`Peace Museum` → `peace-museum`), with `-2`, `-3`… when `taken` has it already. */
export function uniqueId(name: string, taken: Iterable<string>): string {
  const base = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'place'
  const used = new Set(taken)
  let id = base
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`
  return id
}

/** A valid `YYYY-MM-DD` date. */
export function isDate(value: string | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  // Date.UTC rolls 2024-02-30 over to March 1: a real date comes back the same
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === value
}

/**
 * Adds a day after the last one (on the start date for the first), extending the trip end date when needed.
 * `today` is the fallback while those dates are not valid yet.
 */
export function addDay(trip: Trip, today: string): Trip {
  const last = trip.days.at(-1)?.date
  const date = last && isDate(last) ? addDays(last, 1) : isDate(trip.trip.startDate) ? trip.trip.startDate : today
  const endDate = isDate(trip.trip.endDate) && trip.trip.endDate >= date ? trip.trip.endDate : date
  return { ...trip, trip: { ...trip.trip, endDate }, days: [...trip.days, { date, stops: [] }] }
}

export function removeDay(trip: Trip, dayIndex: number): Trip {
  return { ...trip, days: trip.days.filter((_, d) => d !== dayIndex) }
}

export function updateDay(trip: Trip, dayIndex: number, change: (day: Day) => Day): Trip {
  return { ...trip, days: trip.days.map((day, d) => (d === dayIndex ? change(day) : day)) }
}

export function addStop(trip: Trip, dayIndex: number, stop: Stop): Trip {
  return updateDay(trip, dayIndex, (day) => ({ ...day, stops: [...day.stops, stop] }))
}

export function updateStop(trip: Trip, dayIndex: number, stopIndex: number, change: (stop: Stop) => Stop): Trip {
  return updateDay(trip, dayIndex, (day) => ({
    ...day,
    stops: day.stops.map((stop, s) => (s === stopIndex ? change(stop) : stop)),
  }))
}

export function removeStop(trip: Trip, dayIndex: number, stopIndex: number): Trip {
  return updateDay(trip, dayIndex, (day) => ({ ...day, stops: day.stops.filter((_, s) => s !== stopIndex) }))
}

/** Adds a new place named `name` to the catalog: returns the trip and the id given to the place. */
export function addPlace(trip: Trip, name: string): { trip: Trip; id: string } {
  const id = uniqueId(name, trip.places.map((p) => p.id))
  return { trip: { ...trip, places: [...trip.places, { id, name }] }, id }
}

export function updatePlace(trip: Trip, placeIndex: number, change: (place: Place) => Place): Trip {
  return { ...trip, places: trip.places.map((place, p) => (p === placeIndex ? change(place) : place)) }
}

/** Inserts `stop` at `index` of the day `dayIndex`. */
export function insertStop(trip: Trip, dayIndex: number, index: number, stop: Stop): Trip {
  return updateDay(trip, dayIndex, (day) => ({ ...day, stops: [...day.stops.slice(0, index), stop, ...day.stops.slice(index)] }))
}

/**
 * Moves the stop `from` to the day `toDay`, at `toIndex` of that day as it is before the move
 * (`day.stops.length` appends).
 */
export function moveStop(trip: Trip, from: [number, number], toDay: number, toIndex: number): Trip {
  const [fromDay, fromIndex] = from
  const stop = trip.days[fromDay].stops[fromIndex]
  // in the same day, removing the stop first shifts the stops after it
  const index = fromDay === toDay && fromIndex < toIndex ? toIndex - 1 : toIndex
  return insertStop(removeStop(trip, fromDay, fromIndex), toDay, index, stop)
}

/** Removes the place at `placeIndex` from the catalog, and the stops that use it. */
export function removePlace(trip: Trip, placeIndex: number): Trip {
  const id = trip.places[placeIndex]?.id
  const places = trip.places.filter((_, p) => p !== placeIndex)
  // a place without an id (an invalid import) has no stops: the stops without a place stay
  if (id === undefined) return { ...trip, places }
  return {
    ...trip,
    places,
    days: trip.days.map((day) => ({ ...day, stops: day.stops.filter((stop) => stop.placeId !== id) })),
  }
}

export interface LogisticsLists {
  accommodations: Accommodation
  transports: Transport
  reservations: Reservation
}
export type LogisticsList = keyof LogisticsLists

const listOf = <L extends LogisticsList>(trip: Trip, list: L) => (trip.logistics?.[list] ?? []) as LogisticsLists[L][]

function setList<L extends LogisticsList>(trip: Trip, list: L, items: LogisticsLists[L][]): Trip {
  const logistics = withoutUndefined({ ...trip.logistics, [list]: items.length ? items : undefined })
  return setField(trip, 'logistics', Object.keys(logistics).length ? logistics : undefined)
}

/** Adds an item to a logistics list, with an id from `name`: returns the trip and the id. */
export function addLogistics<L extends LogisticsList>(
  trip: Trip, list: L, name: string, item: Omit<LogisticsLists[L], 'id'>,
): { trip: Trip; id: string } {
  const items = listOf(trip, list)
  const id = uniqueId(name, items.map((i) => i.id))
  return { trip: setList(trip, list, [...items, { id, ...item } as LogisticsLists[L]]), id }
}

export function updateLogistics<L extends LogisticsList>(
  trip: Trip, list: L, index: number, change: (item: LogisticsLists[L]) => LogisticsLists[L],
): Trip {
  return setList(trip, list, listOf(trip, list).map((item, i) => (i === index ? change(item) : item)))
}

/**
 * Removes an item of a logistics list and the links to it: the bookings of the stops for a reservation,
 * the accommodation of the day starts and ends.
 */
export function removeLogistics(trip: Trip, list: LogisticsList, index: number): Trip {
  const id = listOf(trip, list)[index]?.id
  const next = setList(trip, list, listOf(trip, list).filter((_, i) => i !== index))
  if (list === 'reservations') {
    return {
      ...next,
      days: next.days.map((day) => ({
        ...day,
        stops: day.stops.map((stop) => (stop.bookedId === id ? setField(stop, 'bookedId', undefined) : stop)),
      })),
    }
  }
  if (list === 'accommodations') {
    // the point keeps its time, notes and travel: it goes back to the default place
    const unlink = <T extends DayStart | DayEnd>(point: T | undefined) => {
      if (point?.accommodationId !== id) return point
      const rest = setField(point, 'accommodationId', undefined)
      return Object.keys(rest).length ? rest : undefined
    }
    return {
      ...next,
      days: next.days.map((day) => withoutUndefined({ ...day, start: unlink(day.start), end: unlink(day.end) })),
    }
  }
  return next
}
