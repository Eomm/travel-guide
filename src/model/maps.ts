// "Open in Google Maps" links (Maps URLs: no API key needed).
// https://developers.google.com/maps/documentation/urls/get-started
import type { Travel } from './trip.gen.ts'

export interface MapPoint {
  name?: string
  lat?: number
  lng?: number
  googlePlaceId?: string
}

const hasCoords = (point: MapPoint) => point.lat !== undefined && point.lng !== undefined

/** Text query for a point: coordinates when known, else the name. */
const query = (point: MapPoint) => (hasCoords(point) ? `${point.lat},${point.lng}` : (point.name ?? ''))

/** Link to a place; undefined when there is nothing to search for. */
export function placeUrl(point: MapPoint): string | undefined {
  if (!hasCoords(point) && !point.name) return undefined
  const params = new URLSearchParams({ api: '1', query: query(point) })
  if (point.googlePlaceId) params.set('query_place_id', point.googlePlaceId)
  return `https://www.google.com/maps/search/?${params}`
}

const travelModes: Record<Travel['mode'], string | undefined> = {
  walk: 'walking',
  train: 'transit',
  subway: 'transit',
  bus: 'transit',
  tram: 'transit',
  ferry: 'transit',
  taxi: 'driving',
  car: 'driving',
  bike: 'bicycling',
  flight: undefined,
  other: undefined,
}

/** Directions from one point to another with the leg's travel mode; undefined when a point is unknown. */
export function directionsUrl(from: MapPoint, to: MapPoint, mode?: Travel['mode']): string | undefined {
  if ((!hasCoords(from) && !from.name) || (!hasCoords(to) && !to.name)) return undefined
  const params = new URLSearchParams({ api: '1', origin: query(from), destination: query(to) })
  if (from.googlePlaceId) params.set('origin_place_id', from.googlePlaceId)
  if (to.googlePlaceId) params.set('destination_place_id', to.googlePlaceId)
  const travelmode = mode && travelModes[mode]
  if (travelmode) params.set('travelmode', travelmode)
  return `https://www.google.com/maps/dir/?${params}`
}

/** Google ignores more waypoints than this. */
const maxWaypoints = 9

/**
 * Directions through all the points of a day, in order: first → last, the others as waypoints.
 * Only the first 9 intermediate points are kept (Maps URLs limit); the extra ones are dropped silently.
 * `travelmode` is set only when all the known modes map to the same one and it is not transit
 * (Google does not support waypoints with transit). Undefined with fewer than 2 known points.
 */
export function dayRouteUrl(points: MapPoint[], modes: (Travel['mode'] | undefined)[]): string | undefined {
  const known = points.filter((point) => hasCoords(point) || point.name)
  if (known.length < 2) return undefined
  const origin = known[0]
  const destination = known[known.length - 1]
  const waypoints = known.slice(1, -1).slice(0, maxWaypoints)
  const params = new URLSearchParams({ api: '1', origin: query(origin), destination: query(destination) })
  if (origin.googlePlaceId) params.set('origin_place_id', origin.googlePlaceId)
  if (destination.googlePlaceId) params.set('destination_place_id', destination.googlePlaceId)
  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.map(query).join('|'))
    // the place ids must match the waypoints one by one
    if (waypoints.every((point) => point.googlePlaceId)) {
      params.set('waypoint_place_ids', waypoints.map((point) => point.googlePlaceId).join('|'))
    }
  }
  const used = new Set(modes.filter((mode) => mode !== undefined).map((mode) => travelModes[mode]))
  const [travelmode] = used
  if (used.size === 1 && travelmode && travelmode !== 'transit') params.set('travelmode', travelmode)
  return `https://www.google.com/maps/dir/?${params}`
}
