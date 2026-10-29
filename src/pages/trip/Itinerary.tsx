import { useTrip } from '../../data/trip-context.ts'
import { useI18n } from '../../i18n/i18n.ts'
import { formatDateRange } from '../../model/format.ts'
import DayJumpBar from './itinerary/DayJumpBar.tsx'
import DaySection from './itinerary/DaySection.tsx'
import styles from './Itinerary.module.css'

export default function Itinerary() {
  const { trip } = useTrip()
  const { lang, t } = useI18n()
  return (
    <>
      <h1 className={styles.heading}>{t('itinerary.title')}</h1>
      <p className={styles.dates}>{formatDateRange(trip.trip.startDate, trip.trip.endDate, lang)}</p>
      {trip.days.length === 0 ? (
        <p className={styles.empty}>{t('itinerary.empty')}</p>
      ) : (
        <>
          <DayJumpBar days={trip.days} />
          {trip.days.map((day) => (
            <DaySection key={day.date} day={day} />
          ))}
        </>
      )}
    </>
  )
}
