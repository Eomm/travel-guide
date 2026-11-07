// `/plan`: the saved drafts, the published trips to update, and a new trip (blank or from a file).
import { type ChangeEvent, type FormEvent, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BackIcon, PlusIcon, UploadIcon } from '../../components/icons.tsx'
import LanguageSwitch from '../../components/LanguageSwitch.tsx'
import ThemeToggle from '../../components/ThemeToggle.tsx'
import { loadTripIndex } from '../../data/trips.ts'
import { useAsync } from '../../data/useAsync.ts'
import { useI18n } from '../../i18n/i18n.ts'
import { locale } from '../../model/format.ts'
import type { Trip } from '../../model/trip.gen.ts'
import { deleteDraft, type Draft, isValidSlug, listDrafts, saveDraft } from '../../planner/drafts.ts'
import { blankTrip, ImportError, parseTripFile } from '../../planner/planner.ts'
import layoutStyles from '../TripLayout.module.css'
import type { PlannerLocationState } from './PlannerLayout.tsx'
import styles from './PlannerStart.module.css'

export default function PlannerStart() {
  const { lang, t } = useI18n()
  const navigate = useNavigate()
  const index = useAsync(loadTripIndex)
  const [drafts] = useState(listDrafts)
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string>()
  const fileRef = useRef<HTMLInputElement>(null)
  const slugId = useId()
  const hintId = useId()

  const draftSlugs = new Set(drafts.map((draft) => draft.slug))
  const publishedSlugs = new Set(index.status === 'success' ? index.data.map((trip) => trip.slug) : [])
  const formatUpdate = (draft: Draft) =>
    new Date(draft.updatedAt).toLocaleString(locale(lang), { dateStyle: 'medium', timeStyle: 'short' })

  const open = (trip: Trip) => {
    const draft = { slug, trip, updatedAt: new Date().toISOString() }
    const saved = saveDraft(draft)
    // not saved: an older draft of the slug would win over the one passed to the Planner
    if (!saved) deleteDraft(slug)
    const state: PlannerLocationState = saved ? {} : { draft }
    navigate(`/plan/${slug}`, { state })
  }
  /** The slug problem, if any. A published slug is fine for an import: it updates that trip. */
  const slugError = (forImport: boolean) => {
    if (!isValidSlug(slug)) return t('planner.slugInvalid')
    if (!forImport && (draftSlugs.has(slug) || publishedSlugs.has(slug))) return t('planner.slugTaken', { slug })
    return undefined
  }

  const startBlank = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const problem = slugError(false)
    setError(problem)
    if (!problem) open(blankTrip(lang))
  }
  const chooseFile = () => {
    const problem = slugError(true)
    setError(problem)
    if (!problem) fileRef.current?.click()
  }
  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // the same file can be chosen again
    if (!file) return
    if (draftSlugs.has(slug) && !window.confirm(t('planner.replaceConfirm', { slug }))) return
    try {
      open(await parseTripFile(await file.text()))
    } catch (error) {
      setError(t('planner.importError', { message: error instanceof ImportError ? error.message : String(error) }))
    }
  }

  return (
    <>
      <header className={layoutStyles.header}>
        <div className={layoutStyles.bar}>
          <Link to="/" className={layoutStyles.back} aria-label={t('nav.allTrips')} title={t('nav.allTrips')}>
            <BackIcon />
          </Link>
          <h1 className={`${layoutStyles.title} ${styles.heading}`}>{t('planner.title')}</h1>
          <div className={layoutStyles.actions}>
            <ThemeToggle />
            <LanguageSwitch />
          </div>
        </div>
      </header>
      <main className={layoutStyles.main}>
        <p className={styles.intro}>{t('planner.intro')}</p>

        {drafts.length > 0 && (
          <section className={styles.section}>
            <h2>{t('planner.drafts')}</h2>
            <ul className={styles.list}>
              {drafts.map((draft) => (
                <li key={draft.slug}>
                  <Link to={`/plan/${draft.slug}`} className={styles.item}>
                    <span className={styles.name}>{draft.trip.trip.title || draft.slug}</span>
                    <span className={styles.meta}>
                      {draft.slug} · {t('planner.updatedAt', { date: formatUpdate(draft) })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.section}>
          <h2>{t('planner.newTrip')}</h2>
          <form className={styles.form} onSubmit={startBlank} noValidate>
            <label htmlFor={slugId} className={styles.label}>{t('planner.slug')}</label>
            <input id={slugId} className={styles.input} value={slug} autoCapitalize="none" autoComplete="off" spellCheck={false}
              aria-describedby={hintId} aria-invalid={!!error} placeholder="japan-2027"
              onChange={(event) => {
                setSlug(event.target.value.trim().toLowerCase())
                setError(undefined)
              }} />
            <p id={hintId} className={error ? `${styles.hint} ${styles.error}` : styles.hint} role={error ? 'alert' : undefined}>
              {error ?? t('planner.slugHint')}
            </p>
            <div className={styles.actions}>
              <button type="submit" className={styles.primary}>
                <PlusIcon />
                {t('planner.startBlank')}
              </button>
              <button type="button" className={styles.secondary} onClick={chooseFile}>
                <UploadIcon />
                {t('planner.import')}
              </button>
              <input ref={fileRef} type="file" accept=".json,.json5,application/json" hidden onChange={importFile} />
            </div>
          </form>
        </section>

        <section className={styles.section}>
          <h2>{t('planner.published')}</h2>
          {index.status === 'loading' && <p className={layoutStyles.status}>{t('common.loading')}</p>}
          {index.status === 'error' && <p role="alert">{t('home.loadError', { message: index.error.message })}</p>}
          {index.status === 'success' && index.data.length === 0 && <p className={layoutStyles.status}>{t('home.empty')}</p>}
          {index.status === 'success' && index.data.length > 0 && (
            <ul className={styles.list}>
              {index.data.map((trip) => (
                <li key={trip.slug}>
                  <Link to={`/plan/${trip.slug}`} className={styles.item}>
                    <span className={styles.name}>{trip.title}</span>
                    <span className={styles.meta}>
                      {trip.slug}
                      {draftSlugs.has(trip.slug) && ` · ${t('planner.hasDraft')}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}
