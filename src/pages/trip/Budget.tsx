import { Link } from 'react-router'
import Price from '../../components/Price.tsx'
import { useTrip } from '../../data/trip-context.ts'
import { useI18n, type Lang, type MessageKey } from '../../i18n/i18n.ts'
import { dayCost, missingPrices, tripCost } from '../../model/budget.ts'
import { countDays, formatDate, formatPrice, locale } from '../../model/format.ts'
import type { Stop, Trip } from '../../model/trip.gen.ts'
import Bar from './budget/Bar.tsx'
import styles from './Budget.module.css'

/** The place name, or the title of a free stop. */
const stopName = (stop: Stop, trip: Trip) =>
  trip.places.find((place) => place.id === stop.placeId)?.name ?? stop.title ?? ''

const formatPercent = (ratio: number, lang: Lang) =>
  new Intl.NumberFormat(locale(lang), { style: 'percent', maximumFractionDigits: 0 }).format(ratio)

function Total() {
  const { trip } = useTrip()
  const { lang, t } = useI18n()
  const { total } = tripCost(trip)
  const price = formatPrice(total, trip.trip, lang)
  const perDay = total / countDays(trip.trip.startDate, trip.trip.endDate)
  return (
    <section className={styles.total}>
      <h2 className={styles.totalLabel}>{t('budget.total')}</h2>
      <p className={styles.totalAmount}>{price.main}</p>
      {price.converted && <p className={styles.totalConverted}>{price.converted}</p>}
      {total > 0 && <p className={styles.perDay}>{t('budget.perDay', { amount: formatPrice(perDay, trip.trip, lang).main })}</p>}
    </section>
  )
}

function ByCategory() {
  const { trip } = useTrip()
  const { lang, t } = useI18n()
  const cost = tripCost(trip)
  const days = trip.days.map((day) => dayCost(day, trip))
  const rows: [MessageKey, number][] = [
    ['budget.category.activities', days.reduce((sum, day) => sum + day.stops, 0)],
    ['budget.category.travel', days.reduce((sum, day) => sum + day.travel, 0)],
    ['budget.category.accommodations', cost.accommodations],
    ['budget.category.transports', cost.transports],
    ['budget.category.reservations', cost.reservations],
  ]
  return (
    <section>
      <h2 className={styles.heading}>{t('budget.byCategory')}</h2>
      <ul className={styles.list}>
        {rows
          .filter(([, amount]) => amount > 0)
          .map(([label, amount]) => (
            <li key={label} className={styles.row}>
              <div className={styles.line}>
                <span>{t(label)}</span>
                <Price amount={amount} />
              </div>
              <div className={styles.share}>
                <Bar ratio={amount / cost.total} />
                <span className={styles.percent}>{formatPercent(amount / cost.total, lang)}</span>
              </div>
            </li>
          ))}
      </ul>
    </section>
  )
}

function ByDay() {
  const { slug, trip } = useTrip()
  const { lang, t } = useI18n()
  const days = trip.days.map((day) => ({ day, cost: dayCost(day, trip) }))
  const max = Math.max(...days.map(({ cost }) => cost.total))
  const money = (amount: number) => formatPrice(amount, trip.trip, lang).main
  return (
    <section>
      <h2 className={styles.heading}>{t('budget.byDay')}</h2>
      <ul className={styles.list}>
        {days.map(({ day, cost }) => (
          <li key={day.date}>
            <Link className={`${styles.row} ${styles.dayLink}`} to={{ pathname: `/${slug}`, hash: `day-${day.date}` }}>
              <div className={styles.line}>
                <span className={styles.dayName}>
                  <span className={styles.date}>{formatDate(day.date, lang, 'short')}</span>
                  {day.title && ` ${day.title}`}
                </span>
                <Price amount={cost.total} />
              </div>
              <Bar ratio={max > 0 ? cost.total / max : 0} />
              <div className={styles.detail}>
                {t('budget.dayStops', { amount: money(cost.stops) })} · {t('budget.dayTravel', { amount: money(cost.travel) })}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function MissingPrices() {
  const { trip } = useTrip()
  const { lang, t } = useI18n()
  const missing = missingPrices(trip)
  if (missing.length === 0) return null
  const count = missing.length
  return (
    <details className={styles.missing}>
      <summary className={styles.summary}>{t(count === 1 ? 'budget.missing.one' : 'budget.missing.other', { count })}</summary>
      <ul className={styles.missingList}>
        {missing.map(({ date, stop, leg }, i) => {
          const name = stopName(stop, trip)
          const mode = stop.travel ? t(`budget.mode.${stop.travel.mode}`) : ''
          return (
            <li key={i} className={styles.missingItem}>
              <span className={styles.date}>{formatDate(date, lang, 'short')}</span>
              {stop.time && <span className={styles.time}>{stop.time}</span>}
              <span>{leg ? t('budget.missingLeg', { mode, name }) : name}</span>
            </li>
          )
        })}
      </ul>
    </details>
  )
}

/** `1 € = 170 ¥`, from the trip settings; non-breaking spaces keep it on one line. */
function rate(trip: Trip, lang: Lang): string | undefined {
  const convert = trip.trip.convertCurrency
  if (!convert) return undefined
  const one = new Intl.NumberFormat(locale(lang), {
    style: 'currency',
    currency: convert.currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(1)
  return `${one} = ${formatPrice(convert.oneEquals, trip.trip, lang).main}`.replace(/ /g, '\u00a0')
}

function Note() {
  const { trip } = useTrip()
  const { lang, t } = useI18n()
  const currency = new Intl.DisplayNames(locale(lang), { type: 'currency' }).of(trip.trip.currency) ?? trip.trip.currency
  const rateText = rate(trip, lang)
  return (
    <p className={styles.note}>
      {t('budget.currencyNote', { currency })}
      {rateText && ` ${t('budget.rateNote', { rate: rateText })}`}
    </p>
  )
}

export default function Budget() {
  const { trip } = useTrip()
  const { t } = useI18n()
  const empty = tripCost(trip).total === 0
  return (
    <>
      <h1>{t('budget.title')}</h1>
      <Total />
      {empty ? <p className={styles.empty}>{t('budget.empty')}</p> : (
        <>
          <ByCategory />
          <ByDay />
        </>
      )}
      <MissingPrices />
      <Note />
    </>
  )
}
