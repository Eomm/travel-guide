import {
  AdvancedMarker, APILoadingStatus, APIProvider, ColorScheme, Map, Polyline,
  useApiLoadingStatus, useMap, useMapsLibrary,
} from '@vis.gl/react-google-maps'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { FlagIcon, PlacesIcon } from '../../../components/icons.tsx'
import { useI18n } from '../../../i18n/i18n.ts'
import type { EndLeg, Leg, Point, Segment } from '../../../model/points.ts'
import styles from './DayMap.module.css'
import { cachedRoute, coords, type LatLng, loadRoute, mapId, mapsKey, routeRequest, strokeColors } from './map.ts'
import { useRouteDistances } from './route-distances.ts'

interface Props {
  start?: Point
  legs: Leg[]
  /** The leg to the end of the day, if any. */
  endLeg?: EndLeg
  /** A stop marker was tapped: index of the stop in the day. */
  onSelectStop: (index: number) => void
}

// --- online / offline
const subscribeOnline = (onChange: () => void) => {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}
const useOnline = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine)

// --- "Hide map" choice
const hiddenKey = 'travel-guide.dayMap.hidden'

function savedHidden(): boolean {
  try {
    return localStorage.getItem(hiddenKey) === '1'
  } catch {
    return false
  }
}

function saveHidden(hidden: boolean) {
  try {
    localStorage.setItem(hiddenKey, hidden ? '1' : '0')
  } catch {
    // not saved: the choice lasts until reload
  }
}

/** Fits the map to the points when they change (e.g. another day), not on every render. */
function FitBounds({ positions }: { positions: LatLng[] }) {
  const map = useMap()
  const fitted = useRef('')
  useEffect(() => {
    const signature = positions.map((p) => `${p.lat},${p.lng}`).join('|')
    if (!map || positions.length === 0 || fitted.current === signature) return
    fitted.current = signature
    if (positions.length === 1) {
      map.setCenter(positions[0])
      map.setZoom(15)
      return
    }
    const bounds = new google.maps.LatLngBounds()
    for (const position of positions) bounds.extend(position)
    map.fitBounds(bounds, 40)
  })
  return null
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
  const { t } = useI18n()
  const status = useApiLoadingStatus()
  const startPosition = coords(start)
  const endPosition = coords(endLeg?.to)
  const positions = [startPosition, ...legs.map((leg) => coords(leg.to)), endPosition].filter((p) => p !== undefined)
  // a day that ends where it starts (e.g. the hotel) gets one marker
  const endMarker = endLeg && endPosition && !samePosition(startPosition, endPosition)

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return <p className={styles.note}>{t('itinerary.mapUnavailable')}</p>
  }
  return (
    <Map className={styles.map} mapId={mapId} defaultCenter={positions[0]} defaultZoom={13}
      gestureHandling="cooperative" disableDefaultUI zoomControl clickableIcons={false} colorScheme={ColorScheme.FOLLOW_SYSTEM}>
      <FitBounds positions={positions} />
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
    </Map>
  )
}

/** Map of the day: start, numbered stops and end, legs as routes or dashed lines. Renders nothing without an API key. */
export default function DayMap(props: Props) {
  const { t } = useI18n()
  const online = useOnline()
  const [hidden, setHidden] = useState(savedHidden)
  const hasPoints = [props.start, ...props.legs.map((leg) => leg.to), props.endLeg?.to].some((p) => coords(p))
  if (!mapsKey || !hasPoints) return null

  const toggle = () => {
    saveHidden(!hidden)
    setHidden(!hidden)
  }
  return (
    <section className={styles.card} aria-labelledby="day-map-title">
      <div className={styles.header}>
        <h2 id="day-map-title" className={styles.title}>{t('itinerary.map')}</h2>
        <button type="button" className={styles.toggle} aria-expanded={!hidden} onClick={toggle}>
          {t(hidden ? 'itinerary.showMap' : 'itinerary.hideMap')}
        </button>
      </div>
      {!hidden && (online ? (
        <APIProvider apiKey={mapsKey}>
          <MapContent {...props} />
        </APIProvider>
      ) : (
        <p className={styles.note}>{t('itinerary.mapUnavailable')}</p>
      ))}
    </section>
  )
}
