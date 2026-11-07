// Planner drafts: one per trip slug, saved in this browser's localStorage after every change.
// A draft is the trip file being written; it may be invalid (the issues panel says why).
import type { Trip } from '../model/trip.gen.ts'

export interface Draft {
  slug: string
  trip: Trip
  /** ISO timestamp of the last change. */
  updatedAt: string
}

const prefix = 'travel-guide.planner.'

/** Trip folder names: lowercase words joined by `-`. `plan` is the Planner route, not a trip. */
export const isValidSlug = (slug: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug !== 'plan'

export function loadDraft(slug: string): Draft | undefined {
  try {
    const saved = localStorage.getItem(prefix + slug)
    return saved ? (JSON.parse(saved) as Draft) : undefined
  } catch {
    // storage blocked (private mode, disabled cookies) or a corrupted entry
    return undefined
  }
}

/** Every saved draft, the last changed first. */
export function listDrafts(): Draft[] {
  const drafts: Draft[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const draft = key?.startsWith(prefix) && loadDraft(key.slice(prefix.length))
      if (draft) drafts.push(draft)
    }
  } catch {
    // storage blocked: no drafts
  }
  return drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** False when the browser refuses to save (storage blocked or full): the draft lives until reload. */
export function saveDraft(draft: Draft): boolean {
  try {
    localStorage.setItem(prefix + draft.slug, JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export function deleteDraft(slug: string) {
  try {
    localStorage.removeItem(prefix + slug)
  } catch {
    // nothing saved to delete
  }
}
