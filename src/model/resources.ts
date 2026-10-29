import type { Trip } from './trip.gen.ts'

/** A resource is an absolute http(s) URL or a path relative to the trip folder. */
export const isRelativeResource = (resource: string) => !/^https?:\/\//i.test(resource)

/** Every resource (`cover`, `image`, audio `src`) of a trip with its path in the file. */
export function tripResources(trip: Trip): { path: (string | number)[]; resource: string }[] {
  const found: { path: (string | number)[]; resource: string }[] = []
  const add = (resource: string | undefined, ...path: (string | number)[]) => {
    if (resource !== undefined) found.push({ path, resource })
  }
  add(trip.trip.cover, 'trip', 'cover')
  trip.places.forEach((place, p) => {
    add(place.image, 'places', p, 'image')
    place.audio?.forEach((track, a) => add(track.src, 'places', p, 'audio', a, 'src'))
  })
  trip.days.forEach((day, d) =>
    day.stops.forEach((stop, s) => stop.audio?.forEach((track, a) => add(track.src, 'days', d, 'stops', s, 'audio', a, 'src'))),
  )
  return found
}
