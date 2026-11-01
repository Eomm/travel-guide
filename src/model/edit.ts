// Pure changes to a trip, used by edit mode: each returns a new trip and leaves the given one untouched.
import type { Stop, Trip } from './trip.gen.ts'

/** The stop fields edited by the stop form. `undefined` removes the field from the stop. */
export type StopPatch = Partial<Pick<Stop, 'time' | 'durationMin' | 'price' | 'notes'>>

/** Applies `patch` to stop `index` of the day on `date` (dates are unique within a trip). */
export function updateStop(trip: Trip, date: string, index: number, patch: StopPatch): Trip {
  return {
    ...trip,
    days: trip.days.map((day) => {
      if (day.date !== date) return day
      return { ...day, stops: day.stops.map((stop, i) => (i === index ? withoutUndefined({ ...stop, ...patch }) : stop)) }
    }),
  }
}

/** A cleared field leaves the object instead of staying as `key: undefined`. */
function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T
}
