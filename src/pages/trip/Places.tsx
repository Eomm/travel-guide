import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { FilterIcon, PlacesIcon, SearchIcon } from '../../components/icons.tsx'
import PlaceBadges from '../../components/PlaceBadges.tsx'
import Stars from '../../components/Stars.tsx'
import { useTrip } from '../../data/trip-context.ts'
import { resolveResource } from '../../data/trips.ts'
import { useI18n } from '../../i18n/i18n.ts'
import { categoryLabel, comparePlaces, normalizeText, placeCategories, placeUses, type PlaceUse } from '../../model/places.ts'
import type { Place } from '../../model/trip.gen.ts'
import styles from './Places.module.css'

type Segment = 'all' | 'wishlist'

interface Filters {
  query: string
  categories: string[]
  veg: boolean
  minStars: number
}

const noFilters: Filters = { query: '', categories: [], veg: false, minStars: 0 }

function matches(place: Place, filters: Filters): boolean {
  if (filters.query && !normalizeText(place.name).includes(normalizeText(filters.query))) return false
  if (filters.categories.length > 0 && !filters.categories.includes(place.category ?? '')) return false
  if (filters.veg && !place.veg) return false
  return (place.stars ?? 0) >= filters.minStars
}

/** Number of active filters besides the search text. */
const activeFilters = (filters: Filters) =>
  filters.categories.length + (filters.veg ? 1 : 0) + (filters.minStars > 0 ? 1 : 0)

function PlaceCard({ place, uses }: { place: Place; uses: PlaceUse[] }) {
  const { slug } = useTrip()
  const { t } = useI18n()
  const days = [...new Set(uses.map((use) => use.dayNumber))]
  return (
    <Link to={encodeURIComponent(place.id)} className={styles.card}>
      {place.image ? (
        <img className={styles.thumb} src={resolveResource(slug, place.image)} alt="" loading="lazy" />
      ) : (
        <span className={`${styles.thumb} ${styles.noThumb}`}>
          <PlacesIcon />
        </span>
      )}
      <span className={styles.body}>
        <span className={styles.name}>{place.name}</span>
        <span className={styles.meta}>
          {place.category && <span>{categoryLabel(place.category)}</span>}
          {place.stars !== undefined && <Stars count={place.stars} />}
          <PlaceBadges place={place} />
        </span>
        {place.description && <span className={styles.description}>{place.description}</span>}
        {days.length > 0 && (
          <span className={styles.used}>
            {t(days.length === 1 ? 'places.inItinerary.one' : 'places.inItinerary.other', { days: days.join(', ') })}
          </span>
        )}
      </span>
    </Link>
  )
}

export default function Places() {
  const { trip } = useTrip()
  const { t } = useI18n()
  const [segment, setSegment] = useState<Segment>('all')
  const [filters, setFilters] = useState(noFilters)
  const [showFilters, setShowFilters] = useState(false)

  const uses = useMemo(() => placeUses(trip), [trip])
  const categories = useMemo(() => placeCategories(trip.places), [trip])
  const wishlist = trip.places.filter((place) => !uses.has(place.id))
  const segmentPlaces = segment === 'all' ? trip.places : wishlist
  const visible = segmentPlaces.filter((place) => matches(place, filters)).sort(comparePlaces)

  const update = (patch: Partial<Filters>) => setFilters((current) => ({ ...current, ...patch }))
  const toggleCategory = (category: string) =>
    update({
      categories: filters.categories.includes(category)
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category],
    })
  const active = activeFilters(filters)
  const filtered = active > 0 || filters.query !== ''

  const segments: { id: Segment; label: string; count: number }[] = [
    { id: 'all', label: t('places.all'), count: trip.places.length },
    { id: 'wishlist', label: t('places.wishlist'), count: wishlist.length },
  ]

  return (
    <>
      <h1>{t('places.title')}</h1>

      <div className={styles.segments} role="group" aria-label={t('places.segments')}>
        {segments.map(({ id, label, count }) => (
          <button key={id} type="button" aria-pressed={segment === id} onClick={() => setSegment(id)}>
            {label} <span className={styles.segmentCount}>{count}</span>
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <SearchIcon />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder={t('places.search')}
            aria-label={t('places.search')}
          />
        </label>
        <button
          type="button"
          className={styles.filtersButton}
          aria-expanded={showFilters}
          aria-controls="place-filters"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FilterIcon />
          <span>{t('places.filters')}</span>
          {active > 0 && <span className={styles.activeCount}>{active}</span>}
        </button>
      </div>

      {showFilters && (
        <div id="place-filters" className={styles.filters}>
          {categories.length > 0 && (
            <fieldset className={styles.fieldset}>
              <legend>{t('places.categories')}</legend>
              <div className={styles.chips}>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={styles.chip}
                    aria-pressed={filters.categories.includes(category)}
                    onClick={() => toggleCategory(category)}
                  >
                    {categoryLabel(category)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <div className={styles.row}>
            <button
              type="button"
              className={styles.chip}
              aria-pressed={filters.veg}
              onClick={() => update({ veg: !filters.veg })}
            >
              {t('places.veg')}
            </button>
            <label className={styles.stars}>
              <span>{t('places.minStars')}</span>
              <select value={filters.minStars} onChange={(event) => update({ minStars: Number(event.target.value) })}>
                <option value={0}>{t('places.anyStars')}</option>
                {[1, 2, 3, 4, 5].map((count) => (
                  <option key={count} value={count}>
                    {t('places.starsAtLeast', { count })}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {filtered && (
            <button type="button" className={styles.reset} onClick={() => setFilters(noFilters)}>
              {t('places.reset')}
            </button>
          )}
        </div>
      )}

      <p className={styles.count} aria-live="polite">
        {t(visible.length === 1 ? 'places.count.one' : 'places.count.other', { count: visible.length })}
      </p>

      {visible.length > 0 ? (
        <ul className={styles.list}>
          {visible.map((place) => (
            <li key={place.id}>
              <PlaceCard place={place} uses={uses.get(place.id) ?? []} />
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <p>
            {filtered && t('places.noResults')}
            {!filtered && t(segment === 'wishlist' && trip.places.length > 0 ? 'places.emptyWishlist' : 'places.empty')}
          </p>
          {filtered && (
            <button type="button" className={styles.reset} onClick={() => setFilters(noFilters)}>
              {t('places.reset')}
            </button>
          )}
        </div>
      )}
    </>
  )
}
