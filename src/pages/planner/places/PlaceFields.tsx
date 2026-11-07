// The fields of a catalog place, edited from a stop of the days and from the places catalog: the main ones,
// and the others on demand.
import { useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import { ChevronIcon } from '../../../components/icons.tsx'
import { useI18n } from '../../../i18n/i18n.ts'
import { setField, updatePlace } from '../../../model/edit.ts'
import { categoryLabel, knownCategories, placeCategories } from '../../../model/places.ts'
import type { Place } from '../../../model/trip.gen.ts'
import { usePlanner } from '../../../planner/planner.ts'
import { NumberField, Row, SelectField, TextField } from '../form/Fields.tsx'
import styles from '../form/Fields.module.css'
import type { IssueLocationState } from '../PlannerBar.tsx'
import { useGoogleCoordinates } from './google-place.ts'
import { moreKeys } from './more-keys.ts'
import PlaceMoreFields from './PlaceMoreFields.tsx'

export default function PlaceFields({ index }: { index: number }) {
  const { t } = useI18n()
  const { trip, update } = usePlanner()
  const place = trip.places[index]
  const categories = useMemo(
    () => [...new Set([...knownCategories, ...placeCategories(trip.places)])].map((value) => ({ value, label: categoryLabel(value, t) })),
    [trip.places, t],
  )
  const google = useGoogleCoordinates()
  const location = useLocation()
  const [more, setMore] = useState(false)
  // opened from an issue on one of the other fields: show them
  const [seen, setSeen] = useState<string>()
  if (location.key !== seen) {
    setSeen(location.key)
    const focus = (location.state as IssueLocationState | null)?.focus ?? ''
    const key = focus.startsWith(`places[${index}].`) ? /^[a-zA-Z]+/.exec(focus.slice(`places[${index}].`.length))?.[0] : undefined
    if (key && moreKeys.includes(key)) setMore(true)
  }
  const path = (key: string) => `places[${index}].${key}`
  const set = <K extends keyof Place>(key: K) => (value: Place[K] | undefined) =>
    update((current) => updatePlace(current, index, (p) => setField(p, key, value)))

  return (
    <>
      <TextField path={path('name')} label={t('planner.place.name')} required value={place.name} onChange={set('name')} />
      <Row>
        <TextField path={path('category')} label={t('planner.place.category')} suggestions={categories}
          value={place.category} onChange={set('category')} />
        <SelectField path={path('stars')} label={t('planner.place.stars')} empty="–"
          options={[0, 1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: '★'.repeat(n) || '0' }))}
          value={place.stars === undefined ? undefined : String(place.stars)}
          onChange={(stars) => set('stars')(stars === undefined ? undefined : Number(stars))} />
      </Row>
      <TextField path={path('description')} label={t('planner.place.description')} value={place.description}
        onChange={set('description')} />
      <TextField path={path('address')} label={t('planner.place.address')} value={place.address} onChange={set('address')} />
      <Row>
        <NumberField path={path('lat')} label={t('planner.place.lat')} placeholder="34.3955" value={place.lat} onChange={set('lat')} />
        <NumberField path={path('lng')} label={t('planner.place.lng')} placeholder="132.4536" value={place.lng} onChange={set('lng')} />
      </Row>
      <TextField path={path('googlePlaceId')} label={t('planner.place.googlePlaceId')}
        hint={google.status ? t(`planner.google.${google.status.state}`, google.status.state === 'error' ? { message: google.status.message } : undefined)
          : t(google.available ? 'planner.hint.googlePlaceIdLookup' : 'planner.hint.googlePlaceId')}
        value={place.googlePlaceId}
        onChange={(googlePlaceId) => {
          set('googlePlaceId')(googlePlaceId)
          google.lookup(googlePlaceId, (current, location) => {
            const i = current.places.findIndex((p) => p.id === place.id)
            if (i < 0 || current.places[i].googlePlaceId !== googlePlaceId) return current
            return updatePlace(current, i, (p) => ({ ...p, ...location }))
          })
        }} />
      <TextField path={path('url')} type="url" label={t('planner.place.url')} placeholder="https://"
        value={place.url} onChange={set('url')} />
      <Row>
        <NumberField path={path('price')} label={t('planner.place.price', { currency: trip.trip.currency })}
          hint={t('planner.hint.placePrice')} value={place.price} onChange={set('price')} />
        <TextField path={path('priceInfo')} label={t('planner.place.priceInfo')} value={place.priceInfo} onChange={set('priceInfo')} />
      </Row>
      <TextField path={path('notes')} label={t('planner.place.notes')} hint={t('planner.hint.markdown')} rows={3}
        value={place.notes} onChange={set('notes')} />
      <button type="button" className={styles.more} aria-expanded={more} onClick={() => setMore(!more)}>
        <ChevronIcon open={more} />
        {t('planner.place.more')}
      </button>
      {more && <PlaceMoreFields index={index} />}
    </>
  )
}
