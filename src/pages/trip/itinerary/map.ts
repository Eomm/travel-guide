// Embedded day map: configuration and real routes for walk / drive / bike legs (Maps JS Routes library).
// Google has no transit data in Japan, so the other modes are drawn as straight lines.
import type { Leg, Point } from '../../../model/points.ts'
import type { Travel } from '../../../model/trip.gen.ts'

/** Without a key (e.g. a fork's PR build) there is no map at all. */
export const mapsKey = import.meta.env.VITE_GMAPS_KEY ?? ''
/** Advanced Markers need a map ID: Google's demo one works when none is configured. */
export const mapId = import.meta.env.VITE_GMAPS_MAP_ID || 'DEMO_MAP_ID'

/** Strokes drawn inside the map canvas, where the CSS tokens do not apply: readable on light and dark maps. */
export const strokeColors = {
  /** Real walk / drive / bike route (solid). */
  route: '#4285f4',
  /** Straight line for transit and unknown legs (dashed). */
  straight: '#f29900',
}

export interface LatLng {
  lat: number
  lng: number
}

export const coords = (point?: Point): LatLng | undefined =>
  point?.lat !== undefined && point.lng !== undefined ? { lat: point.lat, lng: point.lng } : undefined

const routedModes: Partial<Record<Travel['mode'], google.maps.TravelModeString>> = {
  walk: 'WALKING',
  car: 'DRIVING',
  taxi: 'DRIVING',
  bike: 'BICYCLING',
}

export interface RouteRequest {
  /** Cache key: mode + from + to coordinates. */
  key: string
  mode: google.maps.TravelModeString
  from: LatLng
  to: LatLng
}

/** The route to request for a leg; undefined when it is drawn as a straight line (mode or coordinates). */
export function routeRequest(leg: Leg): RouteRequest | undefined {
  const mode = leg.travel && routedModes[leg.travel.mode]
  const from = coords(leg.from)
  const to = coords(leg.to)
  if (!mode || !from || !to) return undefined
  return { key: `travel-guide.route:${mode}:${from.lat},${from.lng}:${to.lat},${to.lng}`, mode, from, to }
}

export interface Route {
  path: LatLng[]
  km: number
}

// one request per leg and page load: results in memory + sessionStorage, failures are not retried
const routes = new Map<string, Route>()
const requests = new Map<string, Promise<Route | undefined>>()

/** A route already computed in this session, if any. */
export function cachedRoute(key: string): Route | undefined {
  let route = routes.get(key)
  if (!route) {
    try {
      const saved = sessionStorage.getItem(key)
      if (saved) route = JSON.parse(saved) as Route
    } catch {
      // storage blocked or invalid: request again
    }
    if (route) routes.set(key, route)
  }
  return route
}

const round = (n: number) => Math.round(n * 1e6) / 1e6

async function computeRoute(library: google.maps.RoutesLibrary, { key, mode, from, to }: RouteRequest) {
  const { routes: found } = await library.Route.computeRoutes({
    origin: from,
    destination: to,
    travelMode: mode,
    fields: ['path', 'distanceMeters'],
  })
  const best = found?.[0]
  if (!best?.path || best.distanceMeters === undefined) throw new Error('no route found')
  const route: Route = { path: best.path.map((p) => ({ lat: round(p.lat), lng: round(p.lng) })), km: best.distanceMeters / 1000 }
  routes.set(key, route)
  try {
    sessionStorage.setItem(key, JSON.stringify(route))
  } catch {
    // storage full or blocked: memory only
  }
  return route
}

/** The cached route, else one request (shared by concurrent callers); undefined when it fails. */
export function loadRoute(library: google.maps.RoutesLibrary, request: RouteRequest): Promise<Route | undefined> {
  const cached = cachedRoute(request.key)
  if (cached) return Promise.resolve(cached)
  let pending = requests.get(request.key)
  if (!pending) {
    pending = computeRoute(library, request).catch((error: unknown) => {
      console.warn(`No ${request.mode} route, drawing a straight line:`, error instanceof Error ? error.message : error)
      return undefined
    })
    requests.set(request.key, pending)
  }
  return pending
}
