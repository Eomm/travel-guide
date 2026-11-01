import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { type Draft, type DraftStore, DraftStoreContext } from './edit.ts'

/** Holds the edit drafts of the trips and warns before a reload or a close would lose a change. */
export default function EditProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Partial<Record<string, Draft>>>({})
  const dirty = Object.values(drafts).some((draft) => draft?.dirty)

  useEffect(() => {
    if (!dirty) return
    // the browser shows its own "leave the page?" message
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const store = useMemo<DraftStore>(
    () => ({
      drafts,
      setDraft: (slug, change) =>
        setDrafts((current) => {
          const { [slug]: draft, ...others } = current
          const next = change(draft)
          return next ? { ...others, [slug]: next } : others
        }),
    }),
    [drafts],
  )

  return <DraftStoreContext value={store}>{children}</DraftStoreContext>
}
