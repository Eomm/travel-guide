// `/plan/:slug/logistics`: accommodations, transports and reservations. A stop is linked to a reservation from
// its own form (Days), a day starts or ends at an accommodation from the day details.
import { useI18n } from '../../i18n/i18n.ts'
import { addDays, isDate } from '../../model/edit.ts'
import { formatDate, formatLocalDateTime } from '../../model/format.ts'
import { usePlanner } from '../../planner/planner.ts'
import styles from './days/Days.module.css'
import { useIssueFocus } from './form/fields.ts'
import { useOpenSet } from './form/open-set.ts'
import { AccommodationFields, ReservationFields, TransportFields } from './logistics/ItemFields.tsx'
import ListEditor from './logistics/ListEditor.tsx'

/** A date or date-time of the trip, readable; as typed while it is not valid. */
function useWhen() {
  const { lang } = useI18n()
  return (value: string | undefined) => {
    if (!value) return ''
    if (isDate(value)) return formatDate(value, lang, 'dayMonth')
    return isDate(value.slice(0, 10)) && /T\d\d:\d\d$/.test(value) ? formatLocalDateTime(value, lang) : value
  }
}

export default function Logistics() {
  const { t } = useI18n()
  const { trip } = usePlanner()
  const when = useWhen()
  const editors = useOpenSet((path) => /^logistics\.[a-z]+\[\d+\]/.exec(path)?.[0])
  useIssueFocus()
  const start = isDate(trip.trip.startDate) ? trip.trip.startDate : ''
  const usedBy = (id: string) => trip.days.flatMap((day) => day.stops.filter((stop) => stop.bookedId === id)).length

  return (
    <>
      <h1>{t('nav.logistics')}</h1>
      <ListEditor list="accommodations" title={t('logistics.accommodations')} newName={t('planner.logistics.newAccommodation')}
        create={(name) => ({ name, checkIn: start, checkOut: start && addDays(start, 1) })}
        summary={(stay) => (
          <>
            <span className={styles.stopName}>{stay.name || t('planner.stop.unnamed')}</span>
            <span className={styles.meta}>{[when(stay.checkIn), when(stay.checkOut)].filter(Boolean).join(' → ')}</span>
          </>
        )}
        fields={(i) => <AccommodationFields index={i} />}
        removeConfirm={(stay) =>
          trip.days.some((day) => day.start?.accommodationId === stay.id || day.end?.accommodationId === stay.id)
            ? t('planner.logistics.removeStayConfirm', { name: stay.name })
            : undefined}
        editors={editors} />
      <ListEditor list="transports" title={t('logistics.transports')} newName={t('planner.logistics.newTransport')}
        create={(title) => ({ type: 'other' as const, title })}
        summary={(transport) => (
          <>
            <span className={styles.time}>{t(`logistics.type.${transport.type}`)}</span>
            <span className={styles.stopName}>{transport.title || t('planner.stop.unnamed')}</span>
            <span className={styles.meta}>{when(transport.departure ?? transport.validFrom)}</span>
          </>
        )}
        fields={(i) => <TransportFields index={i} />}
        editors={editors} />
      <ListEditor list="reservations" title={t('logistics.reservations')} newName={t('planner.logistics.newReservation')}
        create={(title) => ({ title, date: start })}
        summary={(reservation) => (
          <>
            {reservation.time && <span className={styles.time}>{reservation.time}</span>}
            <span className={styles.stopName}>{reservation.title || t('planner.stop.unnamed')}</span>
            <span className={styles.meta}>{when(reservation.date)}</span>
          </>
        )}
        fields={(i) => <ReservationFields index={i} />}
        removeConfirm={(reservation) =>
          usedBy(reservation.id) ? t('planner.logistics.removeReservationConfirm', { name: reservation.title }) : undefined}
        editors={editors} />
    </>
  )
}
