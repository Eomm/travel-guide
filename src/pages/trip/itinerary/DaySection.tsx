import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlagIcon, PlacesIcon, RouteIcon } from '../../../components/icons.tsx'
import Price from '../../../components/Price.tsx'
import { useTrip } from '../../../data/trip-context.ts'
import { useI18n } from '../../../i18n/i18n.ts'
import { dayCost } from '../../../model/budget.ts'
import { formatDate } from '../../../model/format.ts'
import { walkingKm } from '../../../model/geo.ts'
import { dayRouteUrl, placeUrl } from '../../../model/maps.ts'
import {
  dayEndLeg, type DayEndPoint, dayLegs, dayStartPoint, type DayStartPoint, type Segment,
} from '../../../model/points.ts'
import { todayIn } from '../../../model/today.ts'
import type { Day, Stop } from '../../../model/trip.gen.ts'
import DayMap from './DayMap.tsx'
import styles from './DaySection.module.css'
import { kmText } from './labels.ts'
import { legDistance, RouteDistancesContext, useRouteDistances } from './route-distances.ts'
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

function EndRow({ end }: { end: DayEndPoint }) {
  const { t } = useI18n()
  const { point, time, source } = end
  const maps = placeUrl(point)
  return (
    <div className={styles.start}>
      <span className={`${styles.startIcon} ${styles.endIcon}`}>
        <FlagIcon />
      </span>
      <p className={styles.startText}>
        <span className={styles.label}>
          {t('itinerary.end')}
          {time && ` · ${time}`}
        </span>
        <span>{point.name}</span>
        {source !== 'explicit' && (
          <span className={styles.hint}>{t(source === 'stay' ? 'itinerary.endStay' : 'itinerary.endNextStart')}</span>
        )}
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

/** `legs`: the legs to the stops and to the end of the day (walking km). */
function DayRecap({ day, legs }: { day: Day; legs: Segment[] }) {
  const { trip } = useTrip()
  const { lang, t } = useI18n()
  const { km } = useRouteDistances()
  const walking = walkingKm(legs.map((leg) => ({ travel: leg.travel, distance: legDistance(leg, km) })))
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

/** Stable element id of a stop card, the target of the map markers. */
const stopElementId = (stop: Stop, index: number) => `stop-${stop.id ?? index + 1}`

/** Real route lengths reported by the map, by route key. */
function useRouteKm() {
  const [km, setKm] = useState<Record<string, number>>({})
  const report = useCallback((key: string, value: number) => {
    setKm((known) => (known[key] === value ? known : { ...known, [key]: value }))
  }, [])
  return useMemo(() => ({ km, report }), [km, report])
}

/** Scrolls to a stop card and highlights it for a moment. */
function useStopHighlight() {
  const [highlighted, setHighlighted] = useState<string>()
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const select = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlighted(id)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setHighlighted(undefined), 1500)
  }, [])
  return { highlighted, select }
}

/** One day: heading, route link, map, start point, stops with the travel legs between them, end point, recap. */
export default function DaySection({ day }: { day: Day }) {
  const { trip } = useTrip()
  const { lang, t } = useI18n()
  const start = dayStartPoint(day, trip)
  const legs = dayLegs(day, trip)
  const endLeg = dayEndLeg(day, trip)
  const date = formatDate(day.date, lang, 'long')
  const routeKm = useRouteKm()
  const { highlighted, select } = useStopHighlight()
  // the first point is the origin: the travel to reach it is not part of the route
  const segments: Segment[] = endLeg ? [...legs, endLeg] : legs
  const route = dayRouteUrl(
    [...(start ? [start.point] : []), ...segments.map((leg) => leg.to)],
    segments.filter((leg) => leg.from).map((leg) => leg.travel?.mode),
  )
  return (
    <RouteDistancesContext value={routeKm}>
      <section>
        <h1 className={styles.heading}>
          <span className={styles.date}>
            {date}
            {day.date === todayIn(trip.trip.timezone) && <>{' '}<span className={styles.today}>{t('itinerary.today')}</span></>}
          </span>
          {day.title && <span className={styles.title}>{day.title}</span>}
        </h1>
        {route && (
          <a className={styles.route} href={route} target="_blank" rel="noreferrer">
            <RouteIcon />
            {t('itinerary.openDayInMaps')}
          </a>
        )}
        <DayMap start={start?.point} legs={legs} endLeg={endLeg} onSelectStop={(i) => select(stopElementId(legs[i].stop, i))} />
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
              <StopCard stop={leg.stop} point={leg.to} id={stopElementId(leg.stop, i)} number={i + 1}
                highlighted={highlighted === stopElementId(leg.stop, i)} />
            </li>
          ))}
          {endLeg && (
            <li>
              <TravelLeg leg={endLeg} />
              <EndRow end={endLeg.end} />
            </li>
          )}
        </ol>
        <DayRecap day={day} legs={segments} />
      </section>
    </RouteDistancesContext>
  )
}
