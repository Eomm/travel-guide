import { Link } from 'react-router'
import { playerTrack } from '../../../audio/audio.ts'
import { PlayButton } from '../../../components/audio/AudioControls.tsx'
import { PlacesIcon, WarningIcon } from '../../../components/icons.tsx'
import Price from '../../../components/Price.tsx'
import { useTrip } from '../../../data/trip-context.ts'
import { type I18n, useI18n } from '../../../i18n/i18n.ts'
import { stopCost } from '../../../model/budget.ts'
import { formatDuration } from '../../../model/format.ts'
import { type HoursProblem, hoursProblem } from '../../../model/hours.ts'
import { placeUrl } from '../../../model/maps.ts'
import { categoryLabel } from '../../../model/places.ts'
import type { Point } from '../../../model/points.ts'
import type { Stop } from '../../../model/trip.gen.ts'
import styles from './StopCard.module.css'

function hoursText(problem: HoursProblem, t: I18n['t']): string {
  switch (problem.kind) {
    case 'closedDate': return t('hours.closedDate')
    case 'closedDay': return t('hours.closedDay')
    case 'closedAt': return t('hours.closedAt', { time: problem.time, hours: problem.ranges.join(', ') })
    case 'closesDuring': return t('hours.closesDuring', { time: problem.closes })
  }
}

/** The place is closed for (part of) the stop: icon + text, not color only. */
function HoursWarning({ problem }: { problem: HoursProblem }) {
  const { t } = useI18n()
  return (
    <p className={styles.warning}>
      <WarningIcon />
      {hoursText(problem, t)}
    </p>
  )
}

interface Props {
  stop: Stop
  point: Point
  /** Date of the day, for the opening hours. */
  date: string
  /** Element id, the target of the map markers. */
  id?: string
  /** Briefly highlighted after a tap on its map marker. */
  highlighted?: boolean
  /** Position in the day, the same number as its map marker. */
  number?: number
}

export default function StopCard({ stop, point, date, id, highlighted, number }: Props) {
  const { slug, trip } = useTrip()
  const { lang, t } = useI18n()
  const place = trip.places.find((p) => p.id === stop.placeId)
  const reservation = trip.logistics?.reservations?.find((r) => r.id === stop.bookedId)
  const cost = stopCost(stop, trip)
  const maps = placeUrl(point)
  const hours = place?.openingHours && hoursProblem(place.openingHours, date, stop.time, stop.durationMin)
  // the audio of the stop itself; the place tracks are on the place page
  const tracks = (stop.audio ?? []).map((track) => playerTrack(track, slug, point.name, trip.trip.title)).filter((track) => !!track)
  return (
    <article id={id} className={highlighted ? `${styles.card} ${styles.highlighted}` : styles.card}>
      {(number !== undefined || stop.time || reservation) && (
        <p className={styles.top}>
          {number !== undefined && <span className={styles.number}>{number}</span>}
          {stop.time && <span className={styles.time}>{stop.time}</span>}
          {reservation && <span className={styles.badge}>{t('itinerary.booked')}</span>}
        </p>
      )}
      <h2 className={styles.name}>
        {place ? <Link to={`/${slug}/places/${encodeURIComponent(place.id)}`}>{point.name}</Link> : point.name}
      </h2>
      {(place?.category || place?.description) && (
        <p className={styles.description}>
          {place.category && <span className={styles.category}>{categoryLabel(place.category, t)}</span>}
          {place.description}
        </p>
      )}
      {(stop.durationMin !== undefined || cost !== undefined) && (
        <p className={styles.meta}>
          {stop.durationMin !== undefined && <span>{formatDuration(stop.durationMin, lang)}</span>}
          {cost !== undefined && <Price amount={cost} />}
        </p>
      )}
      {hours && <HoursWarning problem={hours} />}
      {reservation && (
        <p className={styles.booking}>
          {reservation.title}
          {reservation.time && ` · ${reservation.time}`}
        </p>
      )}
      {stop.notes && <p className={styles.notes}>{stop.notes}</p>}
      {tracks.map((track) => (
        <PlayButton key={track.src} track={track} className={styles.audio}>
          {track.title}
        </PlayButton>
      ))}
      {maps && (
        <a className={styles.maps} href={maps} target="_blank" rel="noreferrer"
          aria-label={t('itinerary.mapsOf', { name: point.name })}>
          <PlacesIcon />
          {t('itinerary.maps')}
        </a>
      )}
    </article>
  )
}
