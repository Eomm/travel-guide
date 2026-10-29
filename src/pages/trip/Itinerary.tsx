import { useTrip } from '../../data/trip-context.ts'
import { useI18n } from '../../i18n/i18n.ts'
import { formatDate, formatDateRange } from '../../model/format.ts'
import type { Stop, Trip } from '../../model/trip.gen.ts'
import styles from './Itinerary.module.css'

/** The place name, or the title of a free stop. */
const stopName = (stop: Stop, trip: Trip) =>
  trip.places.find((place) => place.id === stop.placeId)?.name ?? stop.title ?? ''

export default function Itinerary() {
  const { trip } = useTrip()
  const { lang, t } = useI18n()
  return (
    <>
      <h1 className={styles.heading}>{t('itinerary.title')}</h1>
      <p className={styles.dates}>{formatDateRange(trip.trip.startDate, trip.trip.endDate, lang)}</p>
      {trip.days.map((day) => (
        <section key={day.date} className={styles.day}>
          <h2 className={styles.dayTitle}>
            {formatDate(day.date, lang, 'long')}
            {day.title && <span className={styles.dayName}>{day.title}</span>}
          </h2>
          <ol className={styles.stops}>
            {day.stops.map((stop, s) => (
              <li key={stop.id ?? s} className={styles.stop}>
                <span className={styles.time}>{stop.time}</span>
                <span>{stopName(stop, trip)}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  )
}
