import type { ComponentType } from 'react'
import {
  BusIcon,
  CarIcon,
  FerryIcon,
  FlightIcon,
  RouteIcon,
  TicketIcon,
  TrainIcon,
} from '../../../components/icons.tsx'
import Price from '../../../components/Price.tsx'
import { useI18n } from '../../../i18n/i18n.ts'
import { countDays, formatDate, formatDateRange, formatDuration, formatLocalDateTime } from '../../../model/format.ts'
import type { Transport } from '../../../model/trip.gen.ts'
import Card, { Fact } from './Card.tsx'
import styles from './Card.module.css'
import { minutesBetween } from './dates.ts'

const icons: Record<Transport['type'], ComponentType> = {
  flight: FlightIcon,
  train: TrainIcon,
  bus: BusIcon,
  ferry: FerryIcon,
  car: CarIcon,
  pass: TicketIcon,
  other: RouteIcon,
}

/** A local date-time with its timezone, when given, as a small label. */
function When({ value, timezone }: { value: string; timezone?: string }) {
  const { lang } = useI18n()
  return (
    <>
      {formatLocalDateTime(value, lang)}
      {timezone && <span className={styles.aside}> {timezone}</span>}
    </>
  )
}

export default function TransportCard({ transport: tr }: { transport: Transport }) {
  const { lang, t } = useI18n()
  const Icon = icons[tr.type]
  const route = [tr.from, tr.to].filter(Boolean).join(' → ')
  // a duration across timezones would need the offsets: only when both are the same (or both missing)
  const minutes =
    tr.departure && tr.arrival && tr.departureTimezone === tr.arrivalTimezone
      ? minutesBetween(tr.departure, tr.arrival)
      : undefined
  const validDays = tr.validFrom && tr.validTo ? countDays(tr.validFrom, tr.validTo) : undefined
  return (
    <Card
      icon={<Icon />}
      title={tr.title}
      meta={[t(`logistics.type.${tr.type}`), route].filter(Boolean).join(' · ')}
      notes={tr.notes}
      links={tr.url ? [{ href: tr.url, label: t('logistics.website') }] : []}
    >
      {tr.departure && (
        <Fact label={t('logistics.departure')}>
          <When value={tr.departure} timezone={tr.departureTimezone} />
        </Fact>
      )}
      {tr.arrival && (
        <Fact label={t('logistics.arrival')}>
          <When value={tr.arrival} timezone={tr.arrivalTimezone} />
        </Fact>
      )}
      {minutes !== undefined && <Fact label={t('logistics.duration')}>{formatDuration(minutes, lang)}</Fact>}
      {(tr.validFrom || tr.validTo) && (
        <Fact label={t('logistics.validity')}>
          {tr.validFrom && tr.validTo
            ? formatDateRange(tr.validFrom, tr.validTo, lang)
            : formatDate((tr.validFrom ?? tr.validTo)!, lang)}
          {validDays !== undefined && (
            <span className={styles.aside}>
              {' '}
              ({t(validDays === 1 ? 'logistics.days.one' : 'logistics.days.other', { count: validDays })})
            </span>
          )}
        </Fact>
      )}
      {tr.price !== undefined && (
        <Fact label={t('logistics.price')}>
          <Price amount={tr.price} />
        </Fact>
      )}
    </Card>
  )
}
