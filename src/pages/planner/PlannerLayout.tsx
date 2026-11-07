// `/plan/:slug`: the Planner on one trip. It shows the saved draft, else the published trip (the first change
// creates the draft), and gives it to the section pages via usePlanner().
import { APIProvider } from '@vis.gl/react-google-maps'
import { useDeferredValue, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router'
import { BackIcon, ItineraryIcon, LogisticsIcon, PlacesIcon, SettingsIcon } from '../../components/icons.tsx'
import LanguageSwitch from '../../components/LanguageSwitch.tsx'
import { mapsKey } from '../../components/map/map.ts'
import TabBar, { type Tab } from '../../components/TabBar.tsx'
import ThemeToggle from '../../components/ThemeToggle.tsx'
import { loadTrip, NotFoundError } from '../../data/trips.ts'
import { useAsync } from '../../data/useAsync.ts'
import { useI18n } from '../../i18n/i18n.ts'
import { withoutGeneratedAudio } from '../../model/tts.ts'
import { deleteDraft, type Draft, loadDraft, saveDraft } from '../../planner/drafts.ts'
import { issuesByPath, type Planner, PlannerContext, tripIssues } from '../../planner/planner.ts'
import layoutStyles from '../TripLayout.module.css'
import PlannerBar from './PlannerBar.tsx'
import SectionBoundary from './SectionBoundary.tsx'

const tabs: Tab[] = [
  { to: 'settings', label: 'planner.settings', Icon: SettingsIcon },
  { to: 'days', label: 'planner.days', Icon: ItineraryIcon },
  { to: 'places', label: 'nav.places', Icon: PlacesIcon },
  { to: 'logistics', label: 'nav.logistics', Icon: LogisticsIcon },
]

/** The published trip without the generated audio, which would block regenerating it when its text changes. */
const loadWrittenTrip = async (slug: string) => withoutGeneratedAudio(await loadTrip(slug))

/** A draft the start page could not save (storage blocked) comes in the navigation state instead. */
export interface PlannerLocationState {
  draft?: Draft
}

function Layout({ slug }: { slug: string }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const published = useAsync(loadWrittenTrip, slug)
  const [{ draft, unsaved }, setState] = useState(() => {
    const saved = loadDraft(slug)
    const passed = (location.state as PlannerLocationState | null)?.draft
    return { draft: saved ?? passed, unsaved: !saved && !!passed }
  })
  const trip = draft?.trip ?? (published.status === 'success' ? published.data : undefined)
  // the checks may lag a keystroke behind on a large trip, the typing does not
  const checked = useDeferredValue(trip)
  const issues = useMemo(() => checked && tripIssues(checked), [checked])
  const byPath = useMemo(() => issues && issuesByPath(issues), [issues])

  const planner: Planner | undefined = trip && issues && byPath && {
    slug,
    trip,
    hasDraft: !!draft,
    unsaved,
    published: published.status === 'success',
    issues,
    issuesAt: (path) => byPath.get(path) ?? [],
    // applied to the current draft, so a change that lands later (e.g. a Google lookup) keeps the ones before it;
    // saving the same draft twice (React may call the updater twice) is harmless
    update: (change) =>
      setState((current) => {
        const next = { slug, trip: change(current.draft?.trip ?? trip), updatedAt: new Date().toISOString() }
        return { draft: next, unsaved: !saveDraft(next) }
      }),
    discard: () => {
      deleteDraft(slug)
      setState({ draft: undefined, unsaved: false })
      if (published.status !== 'success') navigate('/plan')
    },
  }

  const notFound = !trip && published.status === 'error' && published.error instanceof NotFoundError
  return (
    <>
      <header className={layoutStyles.header}>
        <div className={layoutStyles.bar}>
          <Link to="/plan" className={layoutStyles.back} aria-label={t('planner.allDrafts')} title={t('planner.allDrafts')}>
            <BackIcon />
          </Link>
          <span className={layoutStyles.title}>{t('planner.titleOf', { title: trip?.trip.title || slug })}</span>
          <div className={layoutStyles.actions}>
            <ThemeToggle />
            <LanguageSwitch />
          </div>
        </div>
        {planner && <PlannerBar planner={planner} />}
      </header>
      <main className={planner ? `${layoutStyles.main} ${layoutStyles.withTabs}` : layoutStyles.main}>
        {!trip && published.status === 'loading' && <p className={layoutStyles.status}>{t('common.loading')}</p>}
        {notFound && (
          <>
            <h1>{t('planner.notFound', { slug })}</h1>
            <p>
              <Link to="/plan">{t('planner.allDrafts')}</Link>
            </p>
          </>
        )}
        {!trip && published.status === 'error' && !notFound && (
          <p role="alert">{t('trip.loadError', { message: published.error.message })}</p>
        )}
        {planner && (
          <PlannerContext value={planner}>
            {/* a change can fix the draft: try again after each one, and on each section */}
            <SectionBoundary key={location.pathname} resetKey={trip}
              fallback={(message) => <p role="alert">{t('planner.sectionError', { message })}</p>}>
              <Outlet />
            </SectionBoundary>
          </PlannerContext>
        )}
      </main>
      {planner && <TabBar tabs={tabs} label="planner.sections" />}
    </>
  )
}

export default function PlannerLayout() {
  const { slug = '' } = useParams()
  // a new slug starts from its own draft; Google Maps looks up the coordinates of a Google place ID
  const layout = <Layout key={slug} slug={slug} />
  return mapsKey ? <APIProvider apiKey={mapsKey}>{layout}</APIProvider> : layout
}
