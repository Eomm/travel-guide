// The Planner: writes a trip file in the browser, from a blank trip, an imported file or a published trip,
// and downloads it as `trip.json` for `trips/<slug>/`. The draft is autosaved (drafts.ts).
import { createContext, useContext } from 'react'
import type { Lang } from '../i18n/i18n.ts'
import { checkTrip } from '../model/checks.ts'
import type { Issue } from '../model/issues.ts'
import { todayIn } from '../model/today.ts'
import type { Trip } from '../model/trip.gen.ts'
import { validateTrip } from '../model/validate.ts'

export interface Planner {
  slug: string
  trip: Trip
  /** A draft exists: the trip differs from the published one, or is not published. */
  hasDraft: boolean
  /** The browser refused to save the last change: it is lost on reload unless exported. */
  unsaved: boolean
  /** A published trip has this slug. */
  published: boolean
  /** The build checks on the trip, run after every change. */
  issues: TripIssues
  /** The issues of the field at `path` (e.g. `trip.title`), for its inline messages. */
  issuesAt: (path: string) => FieldIssue[]
  /** Changes the draft, e.g. `update((trip) => ({ ...trip, places: […] }))`. */
  update: (change: (trip: Trip) => Trip) => void
  /** Deletes the draft: the Planner goes back to the published trip, if any. */
  discard: () => void
}

export const PlannerContext = createContext<Planner | null>(null)

/** The Planner of the current trip: only inside the pages of PlannerLayout. */
export function usePlanner(): Planner {
  const planner = useContext(PlannerContext)
  if (!planner) throw new Error('usePlanner() must be used inside <PlannerLayout>')
  return planner
}

/** The sections of the Planner, by child route (App.tsx). */
export const sections = ['settings', 'days', 'places', 'logistics'] as const
export type Section = (typeof sections)[number]

/**
 * The section that edits the field at `path` (an Issue path such as `days[0].stops[1].time`).
 * A place used by a stop is edited in that stop, in the days.
 */
export function issueSection(path: string, trip: Trip): Section {
  const root = /^[A-Za-z]+/.exec(path)?.[0]
  if (root === 'places') return placeStop(path, trip) ? 'days' : 'places'
  if (root === 'days' || root === 'logistics') return root
  return 'settings'
}

/** The first stop of the place at `path` (`places[3]…`), as `[day index, stop index]`. */
export function placeStop(path: string, trip: Trip): [number, number] | undefined {
  const index = /^places\[(\d+)\]/.exec(path)?.[1]
  const id = index === undefined ? undefined : trip.places[Number(index)]?.id
  if (id === undefined) return undefined
  for (const [d, day] of trip.days.entries()) {
    const s = day.stops.findIndex((stop) => stop.placeId === id)
    if (s >= 0) return [d, s]
  }
  return undefined
}

export interface TripIssues {
  errors: Issue[]
  warnings: Issue[]
}

export interface FieldIssue {
  message: string
  error: boolean
}

/** The issues by path, the errors first; the issues of list items also under the list. */
export function issuesByPath({ errors, warnings }: TripIssues): Map<string, FieldIssue[]> {
  const byPath = new Map<string, FieldIssue[]>()
  const add = (issue: Issue, error: boolean) => {
    // an issue on a list item (`tags[2]`) also shows on the list field (`tags`)
    const list = /\[\d+\]$/.test(issue.path) ? [issue.path.replace(/\[\d+\]$/, '')] : []
    for (const path of [issue.path, ...list]) {
      byPath.set(path, [...(byPath.get(path) ?? []), { message: issue.message, error }])
    }
  }
  errors.forEach((issue) => add(issue, true))
  warnings.forEach((issue) => add(issue, false))
  return byPath
}

/** The same checks as the build: the schema first, then the semantic checks of a trip that passes it. */
export function tripIssues(trip: Trip): TripIssues {
  const result = validateTrip(trip)
  return result.ok ? checkTrip(result.trip) : { errors: result.issues, warnings: [] }
}

/** A new trip of one day, today, to fill in the Planner. */
export function blankTrip(lang: Lang): Trip {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const today = todayIn(timezone)
  return {
    schemaVersion: 1,
    trip: { title: '', startDate: today, endDate: today, timezone, currency: 'EUR', language: lang },
    places: [],
    days: [],
  }
}

/** The file cannot be imported: not JSON/JSON5, or not shaped like a trip. */
export class ImportError extends Error {
  name = 'ImportError'
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Parses a trip file (JSON or JSON5). The trip may be invalid, but its lists of places, days and stops must be
 * lists of objects: the forms can show and fix a wrong value, not a missing section. Missing lists start empty,
 * a place without a name has an empty one.
 */
export async function parseTripFile(text: string): Promise<Trip> {
  const { default: JSON5 } = await import('json5')
  let data: unknown
  try {
    data = JSON5.parse(text)
  } catch (error) {
    throw new ImportError((error as Error).message)
  }
  if (!isObject(data)) throw new ImportError('the file is not a trip: it must be an object')
  // `$schema` is a path for editors: the export adds it back
  const trip: Record<string, unknown> = { ...data }
  delete trip.$schema
  if (trip.trip !== undefined && !isObject(trip.trip)) throw new ImportError('trip must be an object')
  const list = (key: string, items: unknown) => {
    if (items === undefined) return []
    if (!Array.isArray(items)) throw new ImportError(`${key} must be a list`)
    items.forEach((item, i) => {
      if (!isObject(item)) throw new ImportError(`${key}[${i}] must be an object`)
    })
    return items as Record<string, unknown>[]
  }
  const places = list('places', trip.places).map((place) => ({ ...place, name: place.name ?? '' }))
  const days = list('days', trip.days).map((day, d) => ({ ...day, stops: list(`days[${d}].stops`, day.stops) }))
  return { schemaVersion: 1, ...trip, trip: trip.trip ?? {}, places, days } as unknown as Trip
}

/** Downloads the trip as `trip.json`, to put in `trips/<slug>/` in place of the trip file. */
export function downloadTrip(trip: Trip) {
  // the published data has no `$schema` (scripts/vite-plugin-trips.ts): give it back for the editors
  const json = `${JSON.stringify({ $schema: '../../schema/trip.schema.json', ...trip }, null, 2)}\n`
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'trip.json'
  link.click()
  // some browsers start the download after the click returns
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
