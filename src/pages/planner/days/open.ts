// Which editors of the Days page are open: a stop, its travel leg, the details of a day.
import { createContext, useContext } from 'react'
import type { Trip } from '../../../model/trip.gen.ts'
import { placeStop } from '../../../planner/planner.ts'
import type { OpenSet } from '../form/open-set.ts'

export const dayKey = (d: number) => `days[${d}]`
export const stopKey = (d: number, s: number) => `days[${d}].stops[${s}]`
export const legKey = (d: number, s: number) => `${stopKey(d, s)}.travel`

/** The editor to open to show the field at `path` (an Issue path), if it is in a closed editor. */
export function openKeyFor(path: string, trip: Trip): string | undefined {
  const stop = /^days\[\d+\]\.stops\[\d+\](\.travel)?/.exec(path)
  if (stop) return stop[0]
  const day = /^days\[(\d+)\]\.(date|notes|start|end)/.exec(path)
  if (day) return dayKey(Number(day[1]))
  const place = placeStop(path, trip)
  return place && stopKey(...place)
}

export const OpenContext = createContext<OpenSet | null>(null)

export function useOpen(): OpenSet {
  const editors = useContext(OpenContext)
  if (!editors) throw new Error('useOpen() must be used inside the Days page')
  return editors
}
