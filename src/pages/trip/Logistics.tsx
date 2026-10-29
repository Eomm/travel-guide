import Price from '../../components/Price.tsx'
import { useTrip } from '../../data/trip-context.ts'
import { useI18n, type MessageKey } from '../../i18n/i18n.ts'
import { tripCost } from '../../model/budget.ts'
import AccommodationCard from './logistics/AccommodationCard.tsx'
import { byTime } from './logistics/dates.ts'
import ReservationCard from './logistics/ReservationCard.tsx'
import TransportCard from './logistics/TransportCard.tsx'
import styles from './Logistics.module.css'

type Section = 'accommodations' | 'transports' | 'reservations'

export default function Logistics() {
  const { trip } = useTrip()
  const { t } = useI18n()
  const logistics = trip.logistics ?? {}
  const accommodations = byTime(logistics.accommodations ?? [], (a) => a.checkIn)
  const transports = byTime(logistics.transports ?? [], (tr) => tr.departure ?? tr.validFrom ?? tr.arrival)
  const reservations = byTime(logistics.reservations ?? [], (r) => `${r.date}T${r.time ?? ''}`)
  const counts: Record<Section, number> = {
    accommodations: accommodations.length,
    transports: transports.length,
    reservations: reservations.length,
  }
  const sections = (Object.keys(counts) as Section[]).filter((section) => counts[section] > 0)

  if (!sections.length) {
    return (
      <>
        <h1>{t('logistics.title')}</h1>
        <p className={styles.empty}>{t('logistics.empty')}</p>
      </>
    )
  }

  const cost = tripCost(trip)
  const subtotal = cost.accommodations + cost.transports + cost.reservations
  const booked = new Set(trip.days.flatMap((day) => day.stops.map((stop) => stop.bookedId)))
  const someBooked = reservations.some((r) => booked.has(r.id))
  const countLabel = (section: Section) =>
    t(`logistics.${section}.${counts[section] === 1 ? 'one' : 'other'}` as MessageKey, { count: counts[section] })

  return (
    <>
      <h1>{t('logistics.title')}</h1>
      <section className={styles.summary} aria-label={t('logistics.summary')}>
        <ul className={styles.counts}>
          {sections.map((section) => (
            <li key={section}>
              <a href={`#${section}`} className={styles.count}>
                {countLabel(section)}
              </a>
            </li>
          ))}
        </ul>
        <p className={styles.subtotal}>
          <span>{t('logistics.subtotal')}</span>
          <strong>
            <Price amount={subtotal} />
          </strong>
        </p>
        {someBooked && <p className={styles.hint}>{t('logistics.subtotalHint')}</p>}
      </section>

      {accommodations.length > 0 && (
        <section id="accommodations" className={styles.section}>
          <h2 className={styles.heading}>{t('logistics.accommodations')}</h2>
          <div className={styles.list}>
            {accommodations.map((a) => (
              <AccommodationCard key={a.id} accommodation={a} />
            ))}
          </div>
        </section>
      )}

      {transports.length > 0 && (
        <section id="transports" className={styles.section}>
          <h2 className={styles.heading}>{t('logistics.transports')}</h2>
          <div className={styles.list}>
            {transports.map((tr) => (
              <TransportCard key={tr.id} transport={tr} />
            ))}
          </div>
        </section>
      )}

      {reservations.length > 0 && (
        <section id="reservations" className={styles.section}>
          <h2 className={styles.heading}>{t('logistics.reservations')}</h2>
          <div className={styles.list}>
            {reservations.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
