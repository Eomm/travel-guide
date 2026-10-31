// Route lengths found by the day map, shared with the leg rows and the day recap.
import { createContext, useContext } from 'react'
import type { LegDistance } from '../../../model/geo.ts'
import type { Leg } from '../../../model/points.ts'
import { cachedRoute, routeRequest } from './map.ts'

export interface RouteDistances {
  /** km by route key, filled as the routes arrive. */
  km: Record<string, number>
  report: (key: string, km: number) => void
}

export const RouteDistancesContext = createContext<RouteDistances>({ km: {}, report: () => {} })

/** The manual `distanceKm`, else the real route length when known, else the estimate. */
export function legDistance(leg: Leg, km: RouteDistances['km']): LegDistance | undefined {
  const key = leg.travel?.distanceKm === undefined ? routeRequest(leg)?.key : undefined
  const routed = key === undefined ? undefined : (km[key] ?? cachedRoute(key)?.km)
  return routed === undefined ? leg.distance : { km: routed, estimated: false }
}

export const useRouteDistances = () => useContext(RouteDistancesContext)
