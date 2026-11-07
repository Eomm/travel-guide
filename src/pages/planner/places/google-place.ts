// Fills the coordinates of a place (or an accommodation) from its Google place ID (Maps JavaScript API,
// Places library).
import { useApiIsLoaded } from '@vis.gl/react-google-maps'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { mapsKey } from '../../../components/map/map.ts'
import type { Trip } from '../../../model/trip.gen.ts'
import { usePlanner } from '../../../planner/planner.ts'

export type LookupStatus =
  | { state: 'loading' }
  | { state: 'done' }
  | { state: 'error'; message: string }
  /** The Maps key does not allow the Places API (New): see the README. */
  | { state: 'denied' }

// ~10 cm: more digits are noise in a trip file
const round = (value: number) => Math.round(value * 1e6) / 1e6
// wait for the end of the typing (or of the paste) before asking Google
const delayMs = 600

export interface LatLng {
  lat: number
  lng: number
}

interface Pending {
  googlePlaceId: string
  apply: (trip: Trip, location: LatLng) => Trip
}

/**
 * `lookup(googlePlaceId, apply)` loads the location of `googlePlaceId` and gives it to `apply`, which writes it
 * in the trip (and leaves the trip as is when the Google place ID changed in the meantime). A lookup asked
 * before the Maps script is loaded waits for it. Without a Maps key or offline, `available` is false and
 * nothing is looked up.
 */
export function useGoogleCoordinates() {
  const apiLoaded = useApiIsLoaded()
  const { update } = usePlanner()
  const [status, setStatus] = useState<LookupStatus>()
  const [pending, setPending] = useState<Pending>()
  const timer = useRef<number>(undefined)
  const available = !!mapsKey && navigator.onLine

  const lookup = (googlePlaceId: string | undefined, apply: Pending['apply']) => {
    window.clearTimeout(timer.current)
    setStatus(undefined)
    setPending(undefined)
    const id = googlePlaceId?.trim()
    if (!available || !id) return
    timer.current = window.setTimeout(() => {
      setStatus({ state: 'loading' })
      setPending({ googlePlaceId: id, apply })
    }, delayMs)
  }

  // the latest `update`, without running the lookup again when it changes (on every render)
  const write = useEffectEvent((apply: Pending['apply'], location: LatLng) => update((trip) => apply(trip, location)))

  useEffect(() => {
    if (!pending || !apiLoaded) return
    // a newer lookup (or the end of the page) makes this one stale
    let current = true
    const run = async () => {
      try {
        const { Place } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary
        const place = new Place({ id: pending.googlePlaceId })
        await place.fetchFields({ fields: ['location'] })
        const location = place.location
        if (!location) throw new Error('no location')
        if (!current) return
        write(pending.apply, { lat: round(location.lat()), lng: round(location.lng()) })
        setStatus({ state: 'done' })
      } catch (error) {
        if (!current) return
        const message = error instanceof Error ? error.message : String(error)
        setStatus(/PERMISSION_DENIED|blocked/.test(message) ? { state: 'denied' } : { state: 'error', message })
      }
    }
    void run()
    return () => {
      current = false
    }
  }, [pending, apiLoaded])

  return { available, status, lookup }
}
