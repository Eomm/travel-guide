import { AdvancedMarker, Polyline, useMapsLibrary } from '@vis.gl/react-google-maps'
import { useEffect, useState } from 'react'
import { FlagIcon, PlacesIcon } from '../../../components/icons.tsx'
import { coords, type LatLng } from '../../../components/map/map.ts'
import { MapCard, MapView } from '../../../components/map/MapCard.tsx'
import { useI18n } from '../../../i18n/i18n.ts'
import type { EndLeg, Leg, Point, Segment } from '../../../model/points.ts'
import styles from './DayMap.module.css'
import { cachedRoute, loadRoute, routeRequest, strokeColors } from './map.ts'
import { useRouteDistances } from './route-distances.ts'

interface Props {
  start?: Point
  legs: Leg[]
  /** The leg to the end of the day, if any. */
  endLeg?: EndLeg
  /** A stop marker was tapped: index of the stop in the day. */
  onSelectStop: (index: number) => void
}

const dashed: Pick<google.maps.PolylineOptions, 'strokeOpacity' | 'icons'> = {
  strokeOpacity: 0,
  icons: [{
    icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: strokeColors.straight, strokeWeight: 4, scale: 3 },
    offset: '0',
    repeat: '14px',
  }],
}

/** One leg: the real route for walk / drive / bike, else (or while loading, or on error) a dashed straight line. */
function LegLine({ leg }: { leg: Segment }) {
  const library = useMapsLibrary('routes')
  const { report } = useRouteDistances()
  const request = routeRequest(leg)
  const [route, setRoute] = useState(() => request && cachedRoute(request.key)?.path)

  useEffect(() => {
    if (!library || !request) return
    let active = true
    loadRoute(library, request).then((found) => {
      if (!active || !found) return
      setRoute(found.path)
      report(request.key, found.km)
    })
    return () => {
      active = false
    }
    // the request is identified by its key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library, request?.key, report])

  if (route) return <Polyline path={route} strokeColor={strokeColors.route} strokeOpacity={0.9} strokeWeight={5} />
  const from = coords(leg.from)
  const to = coords(leg.to)
  return from && to ? <Polyline path={[from, to]} {...dashed} /> : null
}

const samePosition = (a?: LatLng, b?: LatLng) => a !== undefined && b !== undefined && a.lat === b.lat && a.lng === b.lng

function MapContent({ start, legs, endLeg, onSelectStop }: Props) {
  const startPosition = coords(start)
  const endPosition = coords(endLeg?.to)
  const positions = [startPosition, ...legs.map((leg) => coords(leg.to)), endPosition].filter((p) => p !== undefined)
  // a day that ends where it starts (e.g. the hotel) gets one marker
  const endMarker = endLeg && endPosition && !samePosition(startPosition, endPosition)

  return (
    <MapView positions={positions}>
      {legs.map((leg, i) => (
        <LegLine key={`${leg.stop.id ?? i}:${routeRequest(leg)?.key}`} leg={leg} />
      ))}
      {endLeg && <LegLine key={`end:${routeRequest(endLeg)?.key}`} leg={endLeg} />}
      {start && startPosition && (
        <AdvancedMarker position={startPosition} title={start.name}>
          <span className={`${styles.marker} ${styles.startMarker}`}>
            <PlacesIcon />
          </span>
        </AdvancedMarker>
      )}
      {legs.map((leg, i) => {
        const position = coords(leg.to)
        return position && (
          <AdvancedMarker key={leg.stop.id ?? i} position={position} title={`${i + 1}. ${leg.to.name}`}
            onClick={() => onSelectStop(i)}>
            <span className={styles.marker}>{i + 1}</span>
          </AdvancedMarker>
        )
      })}
      {endMarker && (
        <AdvancedMarker position={endPosition} title={endLeg.to.name}>
          <span className={`${styles.marker} ${styles.endMarker}`}>
            <FlagIcon />
          </span>
        </AdvancedMarker>
      )}
    </MapView>
  )
}

/** Map of the day: start, numbered stops and end, legs as routes or dashed lines. Renders nothing without an API key. */
export default function DayMap(props: Props) {
  const { t } = useI18n()
  const hasPoints = [props.start, ...props.legs.map((leg) => leg.to), props.endLeg?.to].some((p) => coords(p))
  if (!hasPoints) return null
  return (
    <MapCard titleId="day-map-title" title={t('itinerary.map')} showLabel={t('itinerary.showMap')}
      hideLabel={t('itinerary.hideMap')} unavailable={t('itinerary.mapUnavailable')} storageKey="travel-guide.dayMap.hidden">
      <MapContent {...props} />
    </MapCard>
  )
}
