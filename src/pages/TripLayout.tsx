// `/:slug`: loads the trip once, handles loading / not found / error, and gives it to the child pages via useTrip().
import { Link, Outlet, useParams } from 'react-router'
import { useAudio } from '../audio/audio.ts'
import AudioProvider from '../audio/AudioProvider.tsx'
import MiniPlayer from '../components/audio/MiniPlayer.tsx'
import { BackIcon } from '../components/icons.tsx'
import LanguageSwitch from '../components/LanguageSwitch.tsx'
import TabBar from '../components/TabBar.tsx'
import ThemeToggle from '../components/ThemeToggle.tsx'
import { TripContext } from '../data/trip-context.ts'
import { loadTrip, NotFoundError } from '../data/trips.ts'
import { useAsync } from '../data/useAsync.ts'
import { EditContext, tripEditor, useDraftStore } from '../edit/edit.ts'
import EditBar, { EditButton } from '../edit/EditBar.tsx'
import { useI18n } from '../i18n/i18n.ts'
import styles from './TripLayout.module.css'

function Layout({ slug }: { slug: string }) {
  const { t } = useI18n()
  const { track } = useAudio()
  const state = useAsync(loadTrip, slug)
  const store = useDraftStore()
  const published = state.status === 'success' ? state.data : undefined
  const editor = published && tripEditor(store, slug, published)
  // in edit mode every page shows the draft
  const trip = store.drafts[slug]?.trip ?? published
  const mainClass = [
    styles.main,
    state.status === 'success' && styles.withTabs,
    track && styles.withPlayer,
  ].filter(Boolean).join(' ')
  return (
    <>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link to="/" className={styles.back} aria-label={t('nav.allTrips')} title={t('nav.allTrips')}>
            <BackIcon />
          </Link>
          <span className={styles.title}>{trip?.trip.title ?? ''}</span>
          <div className={styles.actions}>
            {editor && !editor.editing && <EditButton editor={editor} />}
            <ThemeToggle />
            <LanguageSwitch />
          </div>
        </div>
        {editor?.editing && trip && <EditBar trip={trip} editor={editor} />}
      </header>
      <main className={mainClass}>
        {state.status === 'loading' && <p className={styles.status}>{t('common.loading')}</p>}
        {state.status === 'error' && state.error instanceof NotFoundError && <h1>{t('trip.notFound')}</h1>}
        {state.status === 'error' && !(state.error instanceof NotFoundError) && (
          <p role="alert">{t('trip.loadError', { message: state.error.message })}</p>
        )}
        {trip && editor && (
          <TripContext value={{ slug, trip }}>
            <EditContext value={editor}>
              <Outlet />
            </EditContext>
          </TripContext>
        )}
      </main>
      {state.status === 'success' && (
        <>
          <MiniPlayer />
          <TabBar />
        </>
      )}
    </>
  )
}

export default function TripLayout() {
  const { slug = '' } = useParams()
  // one player per trip: leaving the trip or opening another one stops the audio
  return (
    <AudioProvider key={slug}>
      <Layout slug={slug} />
    </AudioProvider>
  )
}
