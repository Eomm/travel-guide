// Which editors of a Planner page are open (a stop, a place, a reservation…), by key.
import { useState } from 'react'
import { useLocation } from 'react-router'
import type { IssueLocationState } from '../PlannerBar.tsx'

export interface OpenSet {
  isOpen: (key: string) => boolean
  toggle: (key: string) => void
  open: (key: string) => void
  /** After a removal the positions move: close everything, or editors open on other items. */
  closeAll: () => void
}

/**
 * The open editors of a page. Opened from an issue (PlannerBar), it also opens `keyFor(path)`, the editor that
 * holds the field of the issue, once per navigation.
 */
export function useOpenSet(keyFor: (path: string) => string | undefined): OpenSet {
  const location = useLocation()
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set())
  const [seen, setSeen] = useState<string>()
  if (location.key !== seen) {
    setSeen(location.key)
    const focus = (location.state as IssueLocationState | null)?.focus
    const key = focus && keyFor(focus)
    if (key && !open.has(key)) setOpen(new Set(open).add(key))
  }
  return {
    isOpen: (key) => open.has(key),
    toggle: (key) =>
      setOpen((current) => {
        const next = new Set(current)
        if (!next.delete(key)) next.add(key)
        return next
      }),
    open: (key) => setOpen((current) => new Set(current).add(key)),
    closeAll: () => setOpen(new Set()),
  }
}
