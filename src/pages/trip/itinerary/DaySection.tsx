import { PlacesIcon, RouteIcon } from '../../../components/icons.tsx'
import Price from '../../../components/Price.tsx'
import { useTrip } from '../../../data/trip-context.ts'
import { useI18n } from '../../../i18n/i18n.ts'
import { dayCost } from '../../../model/budget.ts'
import { formatDate } from '../../../model/format.ts'
import { walkingKm } from '../../../model/geo.ts'
import { dayRouteUrl, placeUrl } from '../../../model/maps.ts'
import { dayLegs, dayStartPoint, type DayStartPoint, type Leg } from '../../../model/points.ts'
import type { Day } from '../../../model/trip.gen.ts'
import styles from './DaySection.module.css'
import { kmText } from './labels.ts'
import StopCard from './StopCard.tsx'
import TravelLeg from './TravelLeg.tsx'

function StartRow({ start }: { start: DayStartPoint }) {
  const { t } = useI18n()
  const { point, time, fromStay } = start
  const maps = placeUrl(point)
  return (
    <div className={styles.start}>
      <span className={styles.startIcon}>
        <PlacesIcon />
      </span>
      <p className={styles.startText}>
        <span className={styles.label}>
          {t('itinerary.start')}
          {time && ` · ${time}`}
        </span>
        <span>{fromStay ? t('itinerary.fromStay', { name: point.name }) : point.name}</span>
      </p>
      {maps && (
        <a className={styles.link} href={maps} target="_blank" rel="noreferrer"
          aria-label={t('itinerary.mapsOf', { name: point.name })}>
          {t('itinerary.maps')}
        </a>
      )}
    </div>
  )
}

function DayRecap({ day, legs }: { day: Day; legs: Leg[] }) {
  const { trip } = useTrip()
  const { lang, t } = useI18n()
  const walking = walkingKm(legs)
  return (
    <div className={styles.recap}>
      <h2 className={styles.recapTitle}>{t('itinerary.recap')}</h2>
      <dl className={styles.stats}>
        <div>
          <dt>{t('itinerary.stopCount')}</dt>
          <dd>{day.stops.length}</dd>
        </div>
        <div>
          <dt>{t('itinerary.dayTotal')}</dt>
          <dd>
            <Price amount={dayCost(day, trip).total} />
          </dd>
        </div>
        {walking.km > 0 && (
          <div>
            <dt>{t('itinerary.walking')}</dt>
            <dd>{kmText(walking, lang, t)}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

/** One day: heading, route link, start point, stops with the travel legs between them, recap. */
export default function DaySection({ day }: { day: Day }) {
  const { trip } = useTrip()
  const { lang, t } = useI18n()
  const start = dayStartPoint(day, trip)
  const legs = dayLegs(day, trip)
  const date = formatDate(day.date, lang, 'long')
  // the first stop is the origin when there is no start: its travel is not part of the route
  const route = dayRouteUrl(
    [...(start ? [start.point] : []), ...legs.map((leg) => leg.to)],
    legs.filter((leg) => leg.from).map((leg) => leg.travel?.mode),
  )
  return (
    <section>
      <h1 className={styles.heading}>
        <span className={styles.date}>{date}</span>
        {day.title && <span className={styles.title}>{day.title}</span>}
      </h1>
      {route && (
        <a className={styles.route} href={route} target="_blank" rel="noreferrer">
          <RouteIcon />
          {t('itinerary.openDayInMaps')}
        </a>
      )}
      {day.notes && <p className={styles.notes}>{day.notes}</p>}
      <ol className={styles.timeline} aria-label={t('itinerary.stopsOf', { date })}>
        {start && (
          <li>
            <StartRow start={start} />
          </li>
        )}
        {legs.map((leg, i) => (
          <li key={leg.stop.id ?? i}>
            <TravelLeg leg={leg} />
            <StopCard stop={leg.stop} point={leg.to} />
          </li>
        ))}
      </ol>
      <DayRecap day={day} legs={legs} />
    </section>
  )
}
