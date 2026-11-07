// Drag and drop on the Days page: a stop moves within its day, to another day or to the wishlist; a wishlist
// place drops into a day as a new stop. The ids are positions: nothing moves until the drop.
import type { UniqueIdentifier } from '@dnd-kit/core'
import { insertStop, moveStop, removeStop } from '../../../model/edit.ts'
import type { Trip } from '../../../model/trip.gen.ts'

export const stopDragId = (d: number, s: number) => `stop:${d}:${s}`
export const placeDragId = (placeId: string) => `place:${placeId}`
export const dayDropId = (d: number) => `day:${d}`
export const wishlistDropId = 'wishlist'

export type Dragged = { kind: 'stop'; day: number; stop: number } | { kind: 'place'; placeId: string }

export type Target = { kind: 'day'; day: number; index: number } | { kind: 'wishlist' }

export function parseDragged(id: UniqueIdentifier): Dragged | undefined {
  const [kind, a, b] = String(id).split(':')
  if (kind === 'stop') return { kind, day: Number(a), stop: Number(b) }
  if (kind === 'place') return { kind, placeId: String(id).slice('place:'.length) }
  return undefined
}

/** Where a drop over `id` lands: before the stop under the pointer, at the end of a day, or the wishlist. */
export function parseTarget(id: UniqueIdentifier, trip: Trip): Target | undefined {
  const [kind, a, b] = String(id).split(':')
  if (id === wishlistDropId) return { kind: 'wishlist' }
  if (kind === 'stop') return { kind: 'day', day: Number(a), index: Number(b) }
  if (kind === 'day') return { kind: 'day', day: Number(a), index: trip.days[Number(a)]?.stops.length ?? 0 }
  return undefined
}

export type DropResult = { trip: Trip } | { refused: 'booked' | 'noPlace' } | undefined

/**
 * The trip after dropping `dragged` on `target`; `refused` when the move is not allowed (a booked stop stays
 * on the day of its reservation, a stop without a place has no place in the wishlist); undefined when nothing
 * changes.
 */
export function drop(trip: Trip, dragged: Dragged, target: Target, below: boolean): DropResult {
  if (dragged.kind === 'place') {
    if (target.kind === 'wishlist') return undefined
    return { trip: insertStop(trip, target.day, target.index + (below ? 1 : 0), { placeId: dragged.placeId }) }
  }
  const stop = trip.days[dragged.day]?.stops[dragged.stop]
  if (!stop) return undefined
  if (target.kind === 'wishlist') {
    if (stop.bookedId) return { refused: 'booked' }
    // the wishlist lists places: a stop without one would just be gone
    if (stop.placeId === undefined) return { refused: 'noPlace' }
    return { trip: removeStop(trip, dragged.day, dragged.stop) }
  }
  if (stop.bookedId && target.day !== dragged.day) return { refused: 'booked' }
  const index = target.index + (below ? 1 : 0)
  if (target.day === dragged.day && (index === dragged.stop || index === dragged.stop + 1)) return undefined
  return { trip: moveStop(trip, [dragged.day, dragged.stop], target.day, index) }
}
