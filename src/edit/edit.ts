// Edit mode: a draft copy of the trip that the pages show and change, validated in the browser and
// downloaded as `trip.json`. Nothing is saved: the drafts live in memory until the tab is closed or reloaded.
import { createContext, useContext } from 'react'
import type { Issue } from '../model/issues.ts'
import { checkTrip } from '../model/checks.ts'
import type { Trip } from '../model/trip.gen.ts'
import { validateTrip } from '../model/validate.ts'

export interface Draft {
  trip: Trip
  /** Changed since edit mode started or since the last download. */
  dirty: boolean
}

/** The drafts of every trip, by slug: they survive moving between the pages and the trips (EditProvider.tsx). */
export interface DraftStore {
  drafts: Partial<Record<string, Draft>>
  /** Replaces the draft of `slug`; `undefined` leaves edit mode. */
  setDraft: (slug: string, change: (draft: Draft | undefined) => Draft | undefined) => void
}

export const DraftStoreContext = createContext<DraftStore | null>(null)

export function useDraftStore(): DraftStore {
  const store = useContext(DraftStoreContext)
  if (!store) throw new Error('useDraftStore() must be used inside <EditProvider>')
  return store
}

/** Edit mode of the current trip. */
export interface TripEditor {
  editing: boolean
  dirty: boolean
  /** Starts editing a copy of the published trip. */
  start: () => void
  /** Leaves edit mode and drops the draft. */
  exit: () => void
  /** Changes the draft, e.g. `update((trip) => updateStop(trip, …))`. */
  update: (change: (trip: Trip) => Trip) => void
  /** The draft was downloaded: it is no longer dirty. */
  saved: () => void
}

/** The editor of the trip `slug`, published as `original`. */
export function tripEditor({ drafts, setDraft }: DraftStore, slug: string, original: Trip): TripEditor {
  const draft = drafts[slug]
  return {
    editing: !!draft,
    dirty: !!draft?.dirty,
    start: () => setDraft(slug, (current) => current ?? { trip: original, dirty: false }),
    exit: () => setDraft(slug, () => undefined),
    update: (change) => setDraft(slug, (current) => current && { trip: change(current.trip), dirty: true }),
    saved: () => setDraft(slug, (current) => current && { ...current, dirty: false }),
  }
}

export const EditContext = createContext<TripEditor | null>(null)

/** Edit mode of the trip: only inside the pages of TripLayout. */
export function useEdit(): TripEditor {
  const editor = useContext(EditContext)
  if (!editor) throw new Error('useEdit() must be used inside <TripLayout>')
  return editor
}

export interface TripIssues {
  errors: Issue[]
  warnings: Issue[]
}

/** The same checks as the build: the schema first, then the semantic checks of a trip that passes it. */
export function tripIssues(trip: Trip): TripIssues {
  const result = validateTrip(trip)
  return result.ok ? checkTrip(result.trip) : { errors: result.issues, warnings: [] }
}

/** Downloads the draft as `trip.json`, to put in `trips/<slug>/` in place of the trip file. */
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
