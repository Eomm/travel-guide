// `/:slug`: loads the trip once, handles loading / not found / error, and gives it to the child pages via useTrip().
import { Link, Outlet, useParams } from 'react-router'
import { BackIcon } from '../components/icons.tsx'
import LanguageSwitch from '../components/LanguageSwitch.tsx'
import TabBar from '../components/TabBar.tsx'
import ThemeToggle from '../components/ThemeToggle.tsx'
import { TripContext } from '../data/trip-context.ts'
import { loadTrip, NotFoundError } from '../data/trips.ts'
import { useAsync } from '../data/useAsync.ts'
import { useI18n } from '../i18n/i18n.ts'
import styles from './TripLayout.module.css'

export default function TripLayout() {
  const { slug = '' } = useParams()
  const { t } = useI18n()
  const state = useAsync(loadTrip, slug)
  return (
    <>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link to="/" className={styles.back} aria-label={t('nav.allTrips')} title={t('nav.allTrips')}>
            <BackIcon />
          </Link>
          <span className={styles.title}>{state.status === 'success' ? state.data.trip.title : ''}</span>
          <div className={styles.actions}>
            <ThemeToggle />
            <LanguageSwitch />
          </div>
        </div>
      </header>
      <main className={state.status === 'success' ? `${styles.main} ${styles.withTabs}` : styles.main}>
        {state.status === 'loading' && <p className={styles.status}>{t('common.loading')}</p>}
        {state.status === 'error' && state.error instanceof NotFoundError && <h1>{t('trip.notFound')}</h1>}
        {state.status === 'error' && !(state.error instanceof NotFoundError) && (
          <p role="alert">{t('trip.loadError', { message: state.error.message })}</p>
        )}
        {state.status === 'success' && (
          <TripContext value={{ slug, trip: state.data }}>
            <Outlet />
          </TripContext>
        )}
      </main>
      {state.status === 'success' && <TabBar />}
    </>
  )
}
