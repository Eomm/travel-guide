import { APILoadingStatus, APIProvider, ColorScheme, Map, useApiLoadingStatus, useMap } from '@vis.gl/react-google-maps'
import { type ReactNode, useEffect, useRef } from 'react'
import styles from './MapCard.module.css'
import { type LatLng, mapId, mapsKey, useHiddenMap, useOnline } from './map.ts'

interface CardProps {
  /** Id of the title, for aria-labelledby. */
  titleId: string
  title: string
  showLabel: string
  hideLabel: string
  /** Shown offline or when the API fails to load. */
  unavailable: string
  /** localStorage key of the "Hide map" choice. */
  storageKey: string
  /** The map and what goes with it: rendered only when shown, online and loaded. */
  children: ReactNode
}

function Loaded({ unavailable, children }: { unavailable: string; children: ReactNode }) {
  const status = useApiLoadingStatus()
  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return <p className={styles.note}>{unavailable}</p>
  }
  return children
}

/** Collapsible card with an embedded map. Renders nothing without an API key. */
export function MapCard({ titleId, title, showLabel, hideLabel, unavailable, storageKey, children }: CardProps) {
  const online = useOnline()
  const [hidden, toggle] = useHiddenMap(storageKey)
  if (!mapsKey) return null
  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>{title}</h2>
        <button type="button" className={styles.toggle} aria-expanded={!hidden} onClick={toggle}>
          {hidden ? showLabel : hideLabel}
        </button>
      </div>
      {!hidden && (online ? (
        <APIProvider apiKey={mapsKey}>
          <Loaded unavailable={unavailable}>{children}</Loaded>
        </APIProvider>
      ) : (
        <p className={styles.note}>{unavailable}</p>
      ))}
    </section>
  )
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

/** The map inside a MapCard, fitted to `positions`; markers and lines as children. */
export function MapView({ positions, children }: { positions: LatLng[]; children: ReactNode }) {
  return (
    <Map className={styles.map} mapId={mapId} defaultCenter={positions[0]} defaultZoom={13}
      gestureHandling="cooperative" disableDefaultUI zoomControl clickableIcons={false} colorScheme={ColorScheme.FOLLOW_SYSTEM}>
      <FitBounds positions={positions} />
      {children}
    </Map>
  )
}
