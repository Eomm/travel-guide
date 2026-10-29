import { Link } from 'react-router'
import LanguageSwitch from '../components/LanguageSwitch.tsx'
import { loadTripIndex, resolveResource } from '../data/trips.ts'
import { useAsync } from '../data/useAsync.ts'
import { useI18n } from '../i18n/i18n.ts'
import { countDays, formatDateRange } from '../model/format.ts'
import type { TripSummary } from '../model/trip-index.ts'
import styles from './Home.module.css'

function TripCard({ trip }: { trip: TripSummary }) {
  const { lang, t } = useI18n()
  const days = countDays(trip.startDate, trip.endDate)
  return (
    <Link to={`/${trip.slug}`} className={styles.card}>
      {trip.cover && <img className={styles.cover} src={resolveResource(trip.slug, trip.cover)} alt="" loading="lazy" />}
      <div className={styles.body}>
        <h2 className={styles.title}>{trip.title}</h2>
        {trip.subtitle && <p className={styles.subtitle}>{trip.subtitle}</p>}
        <p className={styles.meta}>
          {formatDateRange(trip.startDate, trip.endDate, lang)} · {t(days === 1 ? 'home.days.one' : 'home.days.other', { count: days })}
        </p>
      </div>
    </Link>
  )
}

export default function Home() {
  const { t } = useI18n()
  const index = useAsync(loadTripIndex)
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{t('home.title')}</h1>
        <LanguageSwitch />
      </header>
      {index.status === 'loading' && <p className={styles.status}>{t('common.loading')}</p>}
      {index.status === 'error' && (
        <p role="alert">{t('home.loadError', { message: index.error.message })}</p>
      )}
      {index.status === 'success' && index.data.length === 0 && <p className={styles.status}>{t('home.empty')}</p>}
      {index.status === 'success' && index.data.length > 0 && (
        <ul className={styles.list}>
          {index.data.map((trip) => (
            <li key={trip.slug}>
              <TripCard trip={trip} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
