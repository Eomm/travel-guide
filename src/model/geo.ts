// Distances between points (pure). See schema/README.md "Routes and walking distance".
import type { Travel } from './trip.gen.ts'

export interface LatLng {
  lat?: number
  lng?: number
}

const earthRadiusKm = 6371
/** Straight line → rough route length. */
const routeFactor = 1.3

const radians = (degrees: number) => (degrees * Math.PI) / 180

/** Great-circle distance in km; undefined when a coordinate is missing. */
export function haversineKm(a: LatLng, b: LatLng): number | undefined {
  if (a.lat === undefined || a.lng === undefined || b.lat === undefined || b.lng === undefined) return undefined
  const dLat = radians(b.lat - a.lat)
  const dLng = radians(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h))
}

export interface LegDistance {
  km: number
  /** True when computed from the straight line instead of `travel.distanceKm`. */
  estimated: boolean
}

/** `travel.distanceKm`, else the straight line × 1.3; undefined when neither is known. */
export function legDistanceKm(from: LatLng | undefined, to: LatLng, travel?: Travel): LegDistance | undefined {
  if (travel?.distanceKm !== undefined) return { km: travel.distanceKm, estimated: false }
  const straight = from && haversineKm(from, to)
  return straight === undefined ? undefined : { km: straight * routeFactor, estimated: true }
}

/** Sum of the walk legs of a day; `estimated` when at least one of them is. */
export function walkingKm(legs: { travel?: Travel; distance?: LegDistance }[]): LegDistance {
  let km = 0
  let estimated = false
  for (const { travel, distance } of legs) {
    if (travel?.mode !== 'walk' || !distance) continue
    km += distance.km
    estimated ||= distance.estimated
  }
  return { km, estimated }
}
