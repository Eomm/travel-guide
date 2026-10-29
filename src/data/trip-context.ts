// The trip of the current `/:slug` route, loaded once by TripLayout and shared with its pages.
import { createContext, useContext } from 'react'
import type { Trip } from '../model/trip.gen.ts'

export interface TripData {
  /** URL slug, needed by `resolveResource(slug, path)`. */
  slug: string
  trip: Trip
}

export const TripContext = createContext<TripData | null>(null)

/** The loaded trip: only inside the pages of TripLayout, which handles loading and errors. */
export function useTrip(): TripData {
  const data = useContext(TripContext)
  if (!data) throw new Error('useTrip() must be used inside <TripLayout>')
  return data
}
