import { AdvancedMarker } from '@vis.gl/react-google-maps'
import { useState } from 'react'
import { Link } from 'react-router'
import { CloseIcon, HeartIcon, ItineraryIcon } from '../../../components/icons.tsx'
import { coords } from '../../../components/map/map.ts'
import { MapCard, MapView } from '../../../components/map/MapCard.tsx'
import { useI18n } from '../../../i18n/i18n.ts'
import { categoryLabel, type PlaceUse } from '../../../model/places.ts'
import type { Place } from '../../../model/trip.gen.ts'
import styles from './PlacesMap.module.css'

interface Props {
  /** The places matching the filters. */
  places: Place[]
  /** Stops using each place, by place id: a place without uses is in the wishlist. */
  uses: Map<string, PlaceUse[]>
}

/** Scheduled places: a filled marker with a calendar; wishlist: an outlined one with a heart. */
const MarkerIcon = ({ scheduled }: { scheduled: boolean }) => (scheduled ? <ItineraryIcon /> : <HeartIcon />)

function Selected({ place, uses, onClose }: { place: Place; uses: PlaceUse[]; onClose: () => void }) {
  const { t } = useI18n()
  const days = [...new Set(uses.map((use) => use.dayNumber))]
  return (
    <div className={styles.selected} aria-live="polite">
      <span className={days.length > 0 ? styles.badge : `${styles.badge} ${styles.wishlist}`}>
        <MarkerIcon scheduled={days.length > 0} />
      </span>
      <div className={styles.selectedBody}>
        <p className={styles.selectedName}>{place.name}</p>
        <p className={styles.selectedMeta}>
          {place.category && `${categoryLabel(place.category, t)} · `}
          {days.length > 0
            ? t(days.length === 1 ? 'places.inItinerary.one' : 'places.inItinerary.other', { days: days.join(', ') })
            : t('places.mapWishlist')}
        </p>
        <Link className={styles.details} to={encodeURIComponent(place.id)}>{t('places.details')}</Link>
      </div>
      <button type="button" className={styles.close} onClick={onClose} aria-label={t('places.closeSelection')}>
        <CloseIcon />
      </button>
    </div>
  )
}

/** Map of the filtered places: tap a marker for its name and a link to the details. No routes. */
export default function PlacesMap({ places, uses }: Props) {
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState<string>()
  const located = places.flatMap((place) => {
    const position = coords(place)
    return position ? [{ place, position, scheduled: uses.has(place.id) }] : []
  })
  const missing = places.length - located.length
  // a place filtered out is no longer selected
  const selected = located.find(({ place }) => place.id === selectedId)?.place
  if (located.length === 0) return null

  return (
    <MapCard titleId="places-map-title" title={t('places.map')} showLabel={t('places.showMap')}
      hideLabel={t('places.hideMap')} unavailable={t('places.mapUnavailable')} storageKey="travel-guide.placesMap.hidden">
      <MapView positions={located.map(({ position }) => position)}>
        {located.map(({ place, position, scheduled }) => {
          const classes = [styles.marker, !scheduled && styles.wishlist, place.id === selectedId && styles.active]
          return (
            <AdvancedMarker key={place.id} position={position} zIndex={place.id === selectedId ? 1 : 0}
              title={`${place.name} (${t(scheduled ? 'places.mapScheduled' : 'places.mapWishlist')})`}
              onClick={() => setSelectedId(place.id)}>
              <span className={classes.filter(Boolean).join(' ')}>
                <MarkerIcon scheduled={scheduled} />
              </span>
            </AdvancedMarker>
          )
        })}
      </MapView>
      {selected && (
        <Selected place={selected} uses={uses.get(selected.id) ?? []} onClose={() => setSelectedId(undefined)} />
      )}
      <ul className={styles.legend} aria-label={t('places.mapLegend')}>
        <li>
          <span className={styles.badge}><MarkerIcon scheduled /></span>
          {t('places.mapScheduled')}
        </li>
        <li>
          <span className={`${styles.badge} ${styles.wishlist}`}><MarkerIcon scheduled={false} /></span>
          {t('places.mapWishlist')}
        </li>
      </ul>
      {missing > 0 && (
        <p className={styles.missing}>
          {t(missing === 1 ? 'places.noCoords.one' : 'places.noCoords.other', { count: missing })}
        </p>
      )}
    </MapCard>
  )
}
