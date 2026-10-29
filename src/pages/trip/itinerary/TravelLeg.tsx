import type { ComponentType } from 'react'
import Price from '../../../components/Price.tsx'
import {
  BikeIcon, BusIcon, CarIcon, FerryIcon, FlightIcon, RouteIcon, TrainIcon, WalkIcon,
} from '../../../components/icons.tsx'
import { useI18n } from '../../../i18n/i18n.ts'
import { formatDuration } from '../../../model/format.ts'
import { directionsUrl } from '../../../model/maps.ts'
import type { Leg } from '../../../model/points.ts'
import type { Travel } from '../../../model/trip.gen.ts'
import { kmText } from './labels.ts'
import styles from './TravelLeg.module.css'

const modeIcons: Record<Travel['mode'], ComponentType> = {
  walk: WalkIcon,
  train: TrainIcon,
  subway: TrainIcon,
  tram: TrainIcon,
  bus: BusIcon,
  ferry: FerryIcon,
  taxi: CarIcon,
  car: CarIcon,
  bike: BikeIcon,
  flight: FlightIcon,
  other: RouteIcon,
}

/** Connector row before a stop: how to get there from the previous point. */
export default function TravelLeg({ leg }: { leg: Leg }) {
  const { lang, t } = useI18n()
  const { travel, from, to, distance } = leg
  const directions = from && directionsUrl(from, to, travel?.mode)
  if (!travel && !directions) return null
  const Icon = modeIcons[travel?.mode ?? 'other']
  return (
    <div className={styles.leg}>
      <span className={styles.icon}>
        <Icon />
      </span>
      <div className={styles.body}>
        {travel && (
          <p className={styles.facts}>
            <strong>{t(`itinerary.mode.${travel.mode}`)}</strong>
            {travel.line && <span>{travel.line}</span>}
            {travel.durationMin !== undefined && <span>{formatDuration(travel.durationMin, lang)}</span>}
            {distance && <span>{kmText(distance, lang, t)}</span>}
            {travel.price !== undefined && <Price amount={travel.price} />}
          </p>
        )}
        {travel?.notes && <p className={styles.notes}>{travel.notes}</p>}
      </div>
      {directions && (
        <a className={styles.directions} href={directions} target="_blank" rel="noreferrer"
          aria-label={t('itinerary.directionsTo', { name: to.name })}>
          {t('itinerary.directions')}
        </a>
      )}
    </div>
  )
}
