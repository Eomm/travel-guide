// Resolves the points of a day (start, stops) to a name and coordinates, for links, routes and maps.
import { type LegDistance, legDistanceKm } from './geo.ts'
import type { MapPoint } from './maps.ts'
import type { Accommodation, Day, DayStart, Stop, Travel, Trip } from './trip.gen.ts'

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

/** An explicit day start: place, else accommodation, else the free point. */
export function startPoint(start: DayStart, trip: Trip): Point {
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

export interface Leg {
  stop: Stop
  travel?: Travel
  /** The previous point (day start or previous stop); undefined for the first stop of a day without a start. */
  from?: Point
  to: Point
  distance?: LegDistance
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
