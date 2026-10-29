// Places catalog helpers: where each place is used in the itinerary, search and categories.
import type { OpeningHours, Place, Trip } from './trip.gen.ts'

export interface PlaceUse {
  date: string
  /** 1-based day number in the trip. */
  dayNumber: number
  time?: string
  stopId?: string
}

/** Stops using each place, by place id. Accommodations and reservations do not count: only stops. */
export function placeUses(trip: Trip): Map<string, PlaceUse[]> {
  const uses = new Map<string, PlaceUse[]>()
  trip.days.forEach((day, index) => {
    for (const stop of day.stops) {
      if (!stop.placeId) continue
      const use = { date: day.date, dayNumber: index + 1, time: stop.time, stopId: stop.id }
      uses.set(stop.placeId, [...(uses.get(stop.placeId) ?? []), use])
    }
  })
  return uses
}

/** Lowercase without diacritics, for search: `Shukkeien` matches `shukkeièn`. */
export const normalizeText = (text: string) =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

/** Categories are free strings: shown as is, with the first letter capitalised. */
export const categoryLabel = (category: string) => category.charAt(0).toUpperCase() + category.slice(1)

/** Distinct categories of the catalog, sorted. */
export const placeCategories = (places: Place[]) =>
  [...new Set(places.flatMap((place) => (place.category ? [place.category] : [])))].sort()

/** Stars desc, then name. */
export const comparePlaces = (a: Place, b: Place) =>
  (b.stars ?? 0) - (a.stars ?? 0) || a.name.localeCompare(b.name)

export const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Weekday = (typeof weekdays)[number]

export interface WeeklyGroup {
  from: Weekday
  to: Weekday
  /** Empty: closed. */
  ranges: string[]
}

/** Consecutive days with the same hours merged: Mon–Sun 07:30–19:00. A missing day is closed. */
export function groupWeekly(weekly: NonNullable<OpeningHours['weekly']>): WeeklyGroup[] {
  const groups: WeeklyGroup[] = []
  for (const day of weekdays) {
    const ranges = weekly[day] ?? []
    const last = groups.at(-1)
    if (last && last.ranges.join() === ranges.join()) last.to = day
    else groups.push({ from: day, to: day, ranges })
  }
  return groups
}
