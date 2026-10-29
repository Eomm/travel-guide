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

interface Filters {
  query: string
  categories: string[]
  /** Wishlist: only places not used by any stop. */
  onlyUnused: boolean
}

const noFilters: Filters = { query: '', categories: [], onlyUnused: false }

function matches(place: Place, filters: Filters, used: boolean): boolean {
  if (filters.query && !normalizeText(place.name).includes(normalizeText(filters.query))) return false
  if (filters.categories.length > 0 && !filters.categories.includes(place.category ?? '')) return false
  return !(filters.onlyUnused && used)
}

/** Number of active filters besides the search text. */
const activeFilters = (filters: Filters) => filters.categories.length + (filters.onlyUnused ? 1 : 0)

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
  const [filters, setFilters] = useState(noFilters)
  const [showFilters, setShowFilters] = useState(false)

  const uses = useMemo(() => placeUses(trip), [trip])
  const categories = useMemo(() => placeCategories(trip.places), [trip])
  const visible = trip.places.filter((place) => matches(place, filters, uses.has(place.id))).sort(comparePlaces)

  const update = (patch: Partial<Filters>) => setFilters((current) => ({ ...current, ...patch }))
  const toggleCategory = (category: string) =>
    update({
      categories: filters.categories.includes(category)
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category],
    })
  const active = activeFilters(filters)
  const filtered = active > 0 || filters.query !== ''
  // only the wishlist filter is on: nothing left means every place is already in a day
  const onlyWishlist = filters.onlyUnused && filters.categories.length === 0 && filters.query === ''

  return (
    <>
      <h1>{t('places.title')}</h1>

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
          <div className={styles.chips}>
            <button
              type="button"
              className={styles.chip}
              aria-pressed={filters.onlyUnused}
              onClick={() => update({ onlyUnused: !filters.onlyUnused })}
            >
              {t('places.onlyUnused')}
            </button>
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
            {trip.places.length === 0
              ? t('places.empty')
              : t(onlyWishlist ? 'places.emptyWishlist' : 'places.noResults')}
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
