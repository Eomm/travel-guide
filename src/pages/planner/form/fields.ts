// Helpers of the Planner form fields (Fields.tsx).
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import type { IssueLocationState } from '../PlannerBar.tsx'

/** The element id of the field that edits `path` (an Issue path such as `trip.title`). */
export const fieldId = (path: string) => `field-${path}`

/** `days[0].stops[1].time` → `days[0].stops[1]` → `days[0]` → `days`: where to look when a field is missing. */
function parentPaths(path: string): string[] {
  const paths = [path]
  let current = path
  while (true) {
    const next = current.replace(/(\.[^.[\]]+|\[\d+\])$/, '')
    if (next === current || !next) return paths
    paths.push(next)
    current = next
  }
}

/**
 * After a click on an issue (PlannerBar), shows and focuses its field, or the closest element of a parent
 * path when the field itself is not on the page (e.g. a missing object).
 * `ready` delays it until the section has opened what holds the field.
 */
export function useIssueFocus(ready = true) {
  const location = useLocation()
  const focus = (location.state as IssueLocationState | null)?.focus
  useEffect(() => {
    if (!focus || !ready) return
    for (const path of parentPaths(focus)) {
      const element = document.getElementById(fieldId(path))
      if (!element) continue
      element.scrollIntoView({ block: 'center' })
      element.focus({ preventScroll: true })
      return
    }
    // the location key changes on every navigation, so a second click on the same issue works too
  }, [focus, ready, location.key])
}

/** An empty text is a missing value. */
export const textValue = (text: string) => (text.trim() === '' ? undefined : text)
