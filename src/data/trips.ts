// Runtime access to the trip data published by scripts/vite-plugin-trips.ts under `<base>data/`.
// The only place that knows where trips come from. The data was validated at build time.
import { isRelativeResource } from '../model/resources.ts'
import type { TripSummary } from '../model/trip-index.ts'
import type { Trip } from '../model/trip.gen.ts'

const dataUrl = (path: string) => `${import.meta.env.BASE_URL}data/${path}`

/** The requested data does not exist (HTTP 404). */
export class NotFoundError extends Error {
  name = 'NotFoundError'
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(dataUrl(path))
  if (!response.ok && response.status !== 404) throw new Error(`Cannot load ${path}: HTTP ${response.status}`)
  // A server with an SPA fallback (e.g. `vite preview`) answers a missing file with index.html.
  if (response.status === 404 || !response.headers.get('Content-Type')?.includes('json')) {
    throw new NotFoundError(`Not found: ${path}`)
  }
  return (await response.json()) as T
}

export const loadTripIndex = () => getJson<TripSummary[]>('index.json')

export const loadTrip = (slug: string) => getJson<Trip>(`${encodeURIComponent(slug)}/trip.json`)

/** URL of a trip resource: absolute http(s) URLs are kept, relative paths point into the trip data folder. */
export function resolveResource(slug: string, path: string): string {
  return isRelativeResource(path) ? dataUrl(`${encodeURIComponent(slug)}/${path.replace(/^\.\//, '')}`) : path
}
