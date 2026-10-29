import { useEffect } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router'
import { BackIcon } from '../../components/icons.tsx'
import { useTrip } from '../../data/trip-context.ts'
import { useI18n } from '../../i18n/i18n.ts'
import { formatDate } from '../../model/format.ts'
import { todayIn } from '../../model/today.ts'
import type { Day, Trip } from '../../model/trip.gen.ts'
import DaySection from './itinerary/DaySection.tsx'
import DayTabs from './itinerary/DayTabs.tsx'
import styles from './Itinerary.module.css'

/** Day to open on `/:slug`: `#day-YYYY-MM-DD` (links from the other tabs), else today if in the trip, else the first. */
function initialDay(trip: Trip, hash: string): string {
  const has = (date: string) => trip.days.some((day) => day.date === date)
  const fromHash = hash.match(/^#day-(\d{4}-\d{2}-\d{2})$/)?.[1]
  if (fromHash && has(fromHash)) return fromHash
  const today = todayIn(trip.trip.timezone)
  return has(today) ? today : trip.days[0].date
}

function DayNav({ previous, next }: { previous?: Day; next?: Day }) {
  const { slug } = useTrip()
  const { lang, t } = useI18n()
  const link = (day: Day, rel: 'previous' | 'next') => (
    <Link to={`/${slug}/day/${day.date}`} className={rel === 'next' ? `${styles.navLink} ${styles.next}` : styles.navLink}>
      {rel === 'previous' && <BackIcon />}
      <span>
        <span className={styles.navLabel}>{t(`itinerary.${rel}Day`)}</span>
        <span className={styles.navDate}>{formatDate(day.date, lang, 'short')}</span>
      </span>
      {rel === 'next' && <BackIcon />}
    </Link>
  )
  return (
    <nav className={styles.nav} aria-label={t('itinerary.dayNav')}>
      {previous && link(previous, 'previous')}
      {next && link(next, 'next')}
    </nav>
  )
}

/** `/:slug` redirects to a day; `/:slug/day/:date` shows only that day. */
export default function Itinerary() {
  const { trip } = useTrip()
  const { t } = useI18n()
  const { date } = useParams()
  const { hash } = useLocation()
  const index = trip.days.findIndex((day) => day.date === date)

  // a new day starts from the top (e.g. after "next" at the bottom); block body: scrollTo may return a promise
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [date])

  if (trip.days.length === 0) {
    return (
      <>
        <h1>{t('itinerary.title')}</h1>
        <p className={styles.empty}>{t('itinerary.empty')}</p>
      </>
    )
  }
  if (date === undefined) return <Navigate replace to={`day/${initialDay(trip, hash)}`} />
  return (
    <>
      <DayTabs active={date} />
      {index === -1 ? (
        <>
          <h1>{t('itinerary.title')}</h1>
          <p className={styles.empty}>{t('itinerary.dayNotFound', { date })}</p>
        </>
      ) : (
        <>
          <DaySection day={trip.days[index]} />
          <DayNav previous={trip.days[index - 1]} next={trip.days[index + 1]} />
        </>
      )}
    </>
  )
}
