// `/plan/:slug/places`: the places catalog. The places of the days are also edited from their stops; here are
// all of them, the wishlist ones (in no day) too, with a way to add and remove places.
import { type FormEvent, useId, useState } from 'react'
import { ChevronIcon, PlusIcon, SearchIcon, TrashIcon } from '../../components/icons.tsx'
import { useI18n } from '../../i18n/i18n.ts'
import { addPlace, removePlace } from '../../model/edit.ts'
import { categoryLabel, normalizeText } from '../../model/places.ts'
import type { Place } from '../../model/trip.gen.ts'
import { usePlanner } from '../../planner/planner.ts'
import styles from './days/Days.module.css'
import { fieldId, useIssueFocus } from './form/fields.ts'
import { useOpenSet } from './form/open-set.ts'
import placeStyles from './places/Places.module.css'
import PlaceFields from './places/PlaceFields.tsx'

interface ItemProps {
  place: Place
  index: number
  /** The day numbers of its stops. */
  days: number[]
  open: boolean
  onToggle: () => void
}

function PlaceItem({ place, index, days, open, onToggle }: ItemProps) {
  const { t } = useI18n()
  const { update, issuesAt } = usePlanner()
  const stops = days.length
  const hasError = issuesAt(`places[${index}]`).some((issue) => issue.error)
  const where = stops
    ? t(new Set(days).size === 1 ? 'places.inItinerary.one' : 'places.inItinerary.other', { days: [...new Set(days)].join(', ') })
    : t('planner.stop.wishlist')

  const remove = () => {
    const name = place.name || place.id
    const message = stops
      ? t(stops === 1 ? 'planner.removePlaceUsed.one' : 'planner.removePlaceUsed.other', { name, count: stops })
      : t('planner.removePlaceConfirm', { name })
    if (window.confirm(message)) update((current) => removePlace(current, index))
  }

  return (
    <li className={open ? `${styles.stop} ${styles.open}` : styles.stop}>
      <button type="button" id={fieldId(`places[${index}]`)} className={styles.stopHead} aria-expanded={open} onClick={onToggle}>
        <span className={styles.stopInfo}>
          <span className={styles.stopName}>{place.name || t('planner.stop.unnamed')}</span>
          {place.category && <span className={styles.meta}>{categoryLabel(place.category, t)}</span>}
          <span className={styles.meta}>{where}</span>
          {hasError && !open && <span className={styles.errorDot} role="img" aria-label={t('planner.hasErrors')} />}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className={styles.stopBody}>
          <p className={placeStyles.id}>{t('planner.place.id', { id: place.id })}</p>
          <PlaceFields index={index} />
          <button type="button" className={styles.remove} onClick={remove}>
            <TrashIcon />
            {t('planner.removePlace')}
          </button>
        </div>
      )}
    </li>
  )
}

export default function Places() {
  const { t } = useI18n()
  const { trip, update } = usePlanner()
  const searchId = useId()
  const [query, setQuery] = useState('')
  const [onlyWishlist, setOnlyWishlist] = useState(false)
  const [name, setName] = useState('')
  // by place id: the positions move when a place is removed
  const editors = useOpenSet((path) => {
    const index = /^places\[(\d+)\]/.exec(path)?.[1]
    return index === undefined ? undefined : trip.places[Number(index)]?.id
  })
  useIssueFocus()

  const days = new Map<string, number[]>()
  trip.days.forEach((day, d) => day.stops.forEach((stop) => {
    if (stop.placeId !== undefined) days.set(stop.placeId, [...(days.get(stop.placeId) ?? []), d + 1])
  }))
  const search = normalizeText(query)
  const shown = trip.places
    .map((place, index) => ({ place, index }))
    .filter(({ place }) => normalizeText(place.name ?? '').includes(search) && (!onlyWishlist || !days.has(place.id)))

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) return
    // the id the place gets, to open it: the same as in the update unless the places changed in between
    editors.open(addPlace(trip, name.trim()).id)
    update((current) => addPlace(current, name.trim()).trip)
    setName('')
    setQuery('')
    setOnlyWishlist(false)
  }

  return (
    <>
      <h1>{t('nav.places')}</h1>
      <p className={styles.empty}>{t('planner.placesIntro')}</p>
      <form className={placeStyles.add} onSubmit={add}>
        <input className={placeStyles.input} value={name} placeholder={t('planner.place.newName')} autoComplete="off"
          aria-label={t('planner.place.newName')} onChange={(event) => setName(event.target.value)} />
        <button type="submit" className={placeStyles.addButton} disabled={!name.trim()}>
          <PlusIcon />
          {t('planner.addPlace')}
        </button>
      </form>
      <div className={placeStyles.filters}>
        <label htmlFor={searchId} className={placeStyles.search}>
          <SearchIcon />
          <input id={searchId} type="search" value={query} placeholder={t('places.search')} aria-label={t('places.search')}
            onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className={placeStyles.check}>
          <input type="checkbox" checked={onlyWishlist} onChange={(event) => setOnlyWishlist(event.target.checked)} />
          {t('places.onlyUnused')}
        </label>
      </div>
      {trip.places.length === 0 && <p className={styles.empty}>{t('places.empty')}</p>}
      {trip.places.length > 0 && shown.length === 0 && <p className={styles.empty}>{t('places.noResults')}</p>}
      <ul className={placeStyles.list}>
        {shown.map(({ place, index }) => (
          <PlaceItem key={place.id} place={place} index={index} days={days.get(place.id) ?? []}
            open={editors.isOpen(place.id)} onToggle={() => editors.toggle(place.id)} />
        ))}
      </ul>
    </>
  )
}
