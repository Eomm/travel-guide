import { type FormEvent, useId, useState } from 'react'
import { PlusIcon } from '../../../components/icons.tsx'
import { useI18n } from '../../../i18n/i18n.ts'
import { addPlace, addStop } from '../../../model/edit.ts'
import { normalizeText } from '../../../model/places.ts'
import type { Stop } from '../../../model/trip.gen.ts'
import { usePlanner } from '../../../planner/planner.ts'
import styles from './Days.module.css'
import { stopKey, useOpen } from './open.ts'

const maxResults = 8

/**
 * Adds a stop at the end of a day: type a name, then pick a place of the catalog, create a new place
 * (its details are filled in the stop that opens), or add a stop without a place.
 */
export default function AddStop({ dayIndex }: { dayIndex: number }) {
  const { t } = useI18n()
  const { trip, update } = usePlanner()
  const { open: openEditor } = useOpen()
  const [adding, setAdding] = useState(false)
  // after the picker closes, the focus goes back to its button instead of the page
  const [returnFocus, setReturnFocus] = useState(false)
  const [query, setQuery] = useState('')
  const inputId = useId()
  const name = query.trim()
  const newIndex = trip.days[dayIndex].stops.length

  const used = new Set(trip.days.flatMap((day) => day.stops.map((stop) => stop.placeId)))
  const search = normalizeText(name)
  const matches = trip.places
    .filter((place) => normalizeText(place.name).includes(search))
    // the places not in any day yet (the wishlist) first
    .sort((a, b) => Number(used.has(a.id)) - Number(used.has(b.id)) || a.name.localeCompare(b.name))
    .slice(0, maxResults)
  const exact = trip.places.some((place) => normalizeText(place.name) === search)

  const close = () => {
    setAdding(false)
    setReturnFocus(true)
    setQuery('')
  }
  const add = (stop: Stop) => {
    update((current) => addStop(current, dayIndex, stop))
    close()
  }
  const createPlace = () => {
    update((current) => {
      const created = addPlace(current, name)
      return addStop(created.trip, dayIndex, { placeId: created.id })
    })
    // the new stop opens on its place, to fill in the details
    openEditor(stopKey(dayIndex, newIndex))
    close()
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Enter: the only match, else a new place
    if (matches.length === 1 && search) add({ placeId: matches[0].id })
    else if (name) createPlace()
  }

  if (!adding) {
    return (
      <button type="button" className={styles.addStop} autoFocus={returnFocus} onClick={() => setAdding(true)}>
        <PlusIcon />
        {t('planner.addStop')}
      </button>
    )
  }
  return (
    <form className={styles.picker} onSubmit={submit}>
      <label htmlFor={inputId} className={styles.pickerLabel}>{t('planner.addStop')}</label>
      <input id={inputId} className={styles.pickerInput} value={query} autoFocus autoComplete="off"
        placeholder={t('planner.stop.search')} onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => event.key === 'Escape' && close()} />
      <ul className={styles.results}>
        {name && !exact && (
          <li>
            <button type="button" className={styles.create} onClick={createPlace}>
              <PlusIcon />
              {t('planner.stop.createPlace', { name })}
            </button>
          </li>
        )}
        {matches.map((place) => (
          <li key={place.id}>
            <button type="button" onClick={() => add({ placeId: place.id })}>
              <span>{place.name}</span>
              {!used.has(place.id) && <span className={styles.meta}>{t('planner.stop.wishlist')}</span>}
            </button>
          </li>
        ))}
        {name && (
          <li>
            <button type="button" className={styles.free} onClick={() => add({ title: name })}>
              {t('planner.stop.withoutPlace', { name })}
            </button>
          </li>
        )}
      </ul>
      <button type="button" className={styles.cancel} onClick={close}>{t('planner.cancel')}</button>
    </form>
  )
}
