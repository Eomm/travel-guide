// Resolves the points of a day (start, stops, end) to a name and coordinates, for links, routes and maps.
import { type LegDistance, legDistanceKm } from './geo.ts'
import type { MapPoint } from './maps.ts'
import type { Accommodation, Day, DayEnd, DayStart, Stop, Travel, Trip } from './trip.gen.ts'

export interface Point extends MapPoint {
  name: string
}

const findPlace = (trip: Trip, id?: string) => (id === undefined ? undefined : trip.places.find((p) => p.id === id))

const findAccommodation = (trip: Trip, id?: string) =>
  id === undefined ? undefined : trip.logistics?.accommodations?.find((a) => a.id === id)

/** An accommodation, with the coordinates of its catalog place as a fallback. */
export function accommodationPoint(accommodation: Accommodation, trip: Trip): Point {
  const place = findPlace(trip, accommodation.placeId)
  return {
    name: accommodation.name,
    lat: accommodation.lat ?? place?.lat,
    lng: accommodation.lng ?? place?.lng,
    googlePlaceId: accommodation.googlePlaceId ?? place?.googlePlaceId,
  }
}

/** A stop: its title wins over the place name; coordinates come from the place. */
export function stopPoint(stop: Stop, trip: Trip): Point {
  const place = findPlace(trip, stop.placeId)
  return { name: stop.title ?? place?.name ?? '', lat: place?.lat, lng: place?.lng, googlePlaceId: place?.googlePlaceId }
}

/** An explicit day start or end: place, else accommodation, else the free point. */
export function startPoint(start: DayStart | DayEnd, trip: Trip): Point {
  const place = findPlace(trip, start.placeId)
  const stay = findAccommodation(trip, start.accommodationId)
  const base: MapPoint = place ?? (stay ? accommodationPoint(stay, trip) : {})
  return {
    name: place?.name ?? stay?.name ?? start.title ?? start.address ?? '',
    lat: start.lat ?? base.lat,
    lng: start.lng ?? base.lng,
    googlePlaceId: base.googlePlaceId,
  }
}

/** The accommodation of the night before `day`: checkIn < day.date <= checkOut (date parts). */
export function previousNightStay(day: Day, trip: Trip): Accommodation | undefined {
  return trip.logistics?.accommodations?.find(
    (a) => a.checkIn.slice(0, 10) < day.date && day.date <= a.checkOut.slice(0, 10),
  )
}

export interface DayStartPoint {
  point: Point
  time?: string
  /** True when inferred from the previous night's accommodation (no `day.start`). */
  fromStay: boolean
}

/** Where the day starts: `day.start`, else the previous night's accommodation, else undefined. */
export function dayStartPoint(day: Day, trip: Trip): DayStartPoint | undefined {
  if (day.start) return { point: startPoint(day.start, trip), time: day.start.time, fromStay: false }
  const stay = previousNightStay(day, trip)
  return stay && { point: accommodationPoint(stay, trip), fromStay: true }
}

/** A move between two points of a day. */
export interface Segment {
  travel?: Travel
  /** The previous point; undefined when the day has nothing before it. */
  from?: Point
  to: Point
  distance?: LegDistance
}

export interface Leg extends Segment {
  stop: Stop
  /** The previous point (day start or previous stop); undefined for the first stop of a day without a start. */
  from?: Point
}

/** Each stop with the point it is reached from. */
export function dayLegs(day: Day, trip: Trip): Leg[] {
  let from = dayStartPoint(day, trip)?.point
  return day.stops.map((stop) => {
    const to = stopPoint(stop, trip)
    const leg = { stop, travel: stop.travel, from, to, distance: legDistanceKm(from, to, stop.travel) }
    from = to
    return leg
  })
}

/** The accommodation of the night of `day`: checkIn <= day.date < checkOut (date parts). */
export function nightStay(day: Day, trip: Trip): Accommodation | undefined {
  return trip.logistics?.accommodations?.find(
    (a) => a.checkIn.slice(0, 10) <= day.date && day.date < a.checkOut.slice(0, 10),
  )
}

export interface DayEndPoint {
  point: Point
  time?: string
  /** `day.end`, the accommodation of that night, or the start of the next day. */
  source: 'explicit' | 'stay' | 'nextStart'
}

/** Where the day ends: `day.end`, else the night's accommodation, else the next day's start, else undefined. */
export function dayEndPoint(day: Day, trip: Trip): DayEndPoint | undefined {
  if (day.end) return { point: startPoint(day.end, trip), time: day.end.time, source: 'explicit' }
  const stay = nightStay(day, trip)
  if (stay) return { point: accommodationPoint(stay, trip), source: 'stay' }
  const next = trip.days[trip.days.indexOf(day) + 1]
  const nextStart = next && next.date > day.date ? dayStartPoint(next, trip) : undefined
  return nextStart && { point: nextStart.point, source: 'nextStart' }
}

/** Same coordinates, or same name when neither has coordinates. */
export const samePoint = (a: Point, b: Point) =>
  a.lat === b.lat && a.lng === b.lng && (a.lat !== undefined || (a.name !== '' && a.name === b.name))

export interface EndLeg extends Segment {
  end: DayEndPoint
}

/**
 * From the last stop (or the start, for a day without stops) to the end of the day, with `day.end.travel`.
 * Undefined without an end, or when the end is the same point it comes from.
 */
export function dayEndLeg(day: Day, trip: Trip): EndLeg | undefined {
  const end = dayEndPoint(day, trip)
  if (!end) return undefined
  const last = day.stops[day.stops.length - 1]
  const from = last ? stopPoint(last, trip) : dayStartPoint(day, trip)?.point
  if (from && samePoint(from, end.point)) return undefined
  const travel = day.end?.travel
  return { end, travel, from, to: end.point, distance: legDistanceKm(from, end.point, travel) }
}
