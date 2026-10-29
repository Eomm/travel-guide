import { Link } from 'react-router'
import { BookingIcon } from '../../../components/icons.tsx'
import Price from '../../../components/Price.tsx'
import { useTrip } from '../../../data/trip-context.ts'
import { useI18n } from '../../../i18n/i18n.ts'
import { formatLocalDateTime } from '../../../model/format.ts'
import type { Reservation } from '../../../model/trip.gen.ts'
import Card, { Fact } from './Card.tsx'
import styles from './Card.module.css'

/** `YYYY-MM-DD` and optional `HH:MM` as a local date-time. */
const dateTime = (date: string, time?: string) => (time ? `${date}T${time}` : date)

export default function ReservationCard({ reservation: r }: { reservation: Reservation }) {
  const { slug, trip } = useTrip()
  const { lang, t } = useI18n()
  const place = trip.places.find((p) => p.id === r.placeId)
  // the stop that books it (at most one, see the trip checks)
  const day = trip.days.find((d) => d.stops.some((stop) => stop.bookedId === r.id))
  const stop = day?.stops.find((s) => s.bookedId === r.id)
  const footer = (
    <p className={styles.footer}>
      {day ? (
        <Link to={`/${slug}#day-${day.date}`}>
          {t('logistics.inItinerary', { when: formatLocalDateTime(dateTime(day.date, stop?.time), lang) })}
        </Link>
      ) : (
        <span className={styles.muted}>{t('logistics.notInItinerary')}</span>
      )}
    </p>
  )
  return (
    <Card
      icon={<BookingIcon />}
      title={r.title}
      notes={r.notes}
      footer={footer}
      links={r.url ? [{ href: r.url, label: t('logistics.website') }] : []}
    >
      <Fact label={t('logistics.when')}>
        {formatLocalDateTime(dateTime(r.date, r.time), lang)}
      </Fact>
      {place && (
        <Fact label={t('logistics.place')}>
          <Link to={`/${slug}/places/${place.id}`}>{place.name}</Link>
        </Fact>
      )}
      {r.partySize !== undefined && <Fact label={t('logistics.partySize')}>{r.partySize}</Fact>}
      {r.price !== undefined && (
        <Fact label={t('logistics.price')}>
          <Price amount={r.price} />
        </Fact>
      )}
    </Card>
  )
}
