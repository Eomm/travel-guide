// Embedded maps (Maps JS API): configuration, coordinates and the remembered "Hide map" choice.
import { useState, useSyncExternalStore } from 'react'

/** Without a key (e.g. a fork's PR build) there is no map at all. */
export const mapsKey = import.meta.env.VITE_GMAPS_KEY ?? ''
/** Advanced Markers need a map ID: Google's demo one works when none is configured. */
export const mapId = import.meta.env.VITE_GMAPS_MAP_ID || 'DEMO_MAP_ID'

export interface LatLng {
  lat: number
  lng: number
}

export const coords = (point?: { lat?: number; lng?: number }): LatLng | undefined =>
  point?.lat !== undefined && point.lng !== undefined ? { lat: point.lat, lng: point.lng } : undefined

// --- online / offline
const subscribeOnline = (onChange: () => void) => {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}
export const useOnline = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine)

// --- "Hide map" choice, one localStorage key per map
function savedHidden(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function saveHidden(key: string, hidden: boolean) {
  try {
    localStorage.setItem(key, hidden ? '1' : '0')
  } catch {
    // not saved: the choice lasts until reload
  }
}

/** Whether the map is hidden, and the toggle that remembers the choice. */
export function useHiddenMap(key: string): [boolean, () => void] {
  const [hidden, setHidden] = useState(() => savedHidden(key))
  const toggle = () => {
    saveHidden(key, !hidden)
    setHidden(!hidden)
  }
  return [hidden, toggle]
}
