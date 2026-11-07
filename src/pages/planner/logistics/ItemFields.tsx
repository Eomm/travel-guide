// The fields of each kind of logistics item.
import { useMemo } from 'react'
import { useI18n } from '../../../i18n/i18n.ts'
import { type LogisticsList, type LogisticsLists, setField, updateLogistics } from '../../../model/edit.ts'
import type { Transport } from '../../../model/trip.gen.ts'
import { usePlanner } from '../../../planner/planner.ts'
import { timezoneSuggestions } from '../../../planner/suggestions.ts'
import { DateTimeField, NumberField, Row, SelectField, TextField } from '../form/Fields.tsx'
import { useGoogleCoordinates } from '../places/google-place.ts'
import { itemKey } from './keys.ts'

/** Path and setter of the fields of item `index` of `list`. */
function useItem<L extends LogisticsList>(list: L, index: number) {
  const { trip, update } = usePlanner()
  const item = (trip.logistics?.[list] ?? [])[index] as LogisticsLists[L]
  const path = (key: string) => `${itemKey(list, index)}.${key}`
  const set = <K extends keyof LogisticsLists[L]>(key: K) => (value: LogisticsLists[L][K] | undefined) =>
    update((current) => updateLogistics(current, list, index, (i) => setField(i, key, value)))
  return { trip, item, path, set }
}

/** A select of the catalog places, for an optional link to one of them. */
function usePlaceOptions() {
  const { trip } = usePlanner()
  return trip.places.map((place) => ({ value: place.id, label: place.name || place.id }))
}

export function AccommodationFields({ index }: { index: number }) {
  const { t } = useI18n()
  const { trip, item, path, set } = useItem('accommodations', index)
  const places = usePlaceOptions()
  const google = useGoogleCoordinates()
  return (
    <>
      <TextField path={path('name')} label={t('planner.place.name')} required value={item.name} onChange={set('name')} />
      <DateTimeField path={path('checkIn')} label={t('logistics.checkIn')} timeLabel={t('planner.logistics.checkInTime')}
        required value={item.checkIn} onChange={set('checkIn')} />
      <DateTimeField path={path('checkOut')} label={t('logistics.checkOut')} timeLabel={t('planner.logistics.checkOutTime')}
        required value={item.checkOut} onChange={set('checkOut')} />
      <NumberField path={path('price')} label={t('planner.logistics.stayPrice', { currency: trip.trip.currency })}
        value={item.price} onChange={set('price')} />
      <SelectField path={path('placeId')} label={t('planner.logistics.place')} hint={t('planner.hint.accommodationPlace')}
        empty={t('planner.logistics.noPlace')} options={places} value={item.placeId} onChange={set('placeId')} />
      <TextField path={path('address')} label={t('planner.place.address')} value={item.address} onChange={set('address')} />
      <TextField path={path('googlePlaceId')} label={t('planner.place.googlePlaceId')}
        hint={google.status ? t(`planner.google.${google.status.state}`, google.status.state === 'error' ? { message: google.status.message } : undefined)
          : t(google.available ? 'planner.hint.googlePlaceIdLookup' : 'planner.hint.googlePlaceId')}
        value={item.googlePlaceId}
        onChange={(googlePlaceId) => {
          set('googlePlaceId')(googlePlaceId)
          google.lookup(googlePlaceId, (current, location) => {
            const stay = current.logistics?.accommodations?.[index]
            if (stay?.id !== item.id || stay.googlePlaceId !== googlePlaceId) return current
            return updateLogistics(current, 'accommodations', index, (a) => ({ ...a, ...location }))
          })
        }} />
      <Row>
        <NumberField path={path('lat')} label={t('planner.place.lat')} value={item.lat} onChange={set('lat')} />
        <NumberField path={path('lng')} label={t('planner.place.lng')} value={item.lng} onChange={set('lng')} />
      </Row>
      <TextField path={path('url')} type="url" label={t('planner.place.url')} placeholder="https://" value={item.url} onChange={set('url')} />
      <TextField path={path('notes')} label={t('planner.place.notes')} rows={3} value={item.notes} onChange={set('notes')} />
    </>
  )
}

const transportTypes: Transport['type'][] = ['flight', 'train', 'bus', 'ferry', 'car', 'pass', 'other']

export function TransportFields({ index }: { index: number }) {
  const { t } = useI18n()
  const { trip, item, path, set } = useItem('transports', index)
  const timezones = useMemo(() => timezoneSuggestions(), [])
  return (
    <>
      <Row>
        <SelectField path={path('type')} label={t('planner.logistics.type')} required value={item.type}
          options={transportTypes.map((type) => ({ value: type, label: t(`logistics.type.${type}`) }))}
          onChange={(type) => set('type')(type ?? 'other')} />
        <TextField path={path('title')} label={t('planner.audio.title')} required value={item.title} onChange={set('title')} />
      </Row>
      {item.type === 'pass' ? (
        <Row>
          <TextField path={path('validFrom')} type="date" label={t('planner.logistics.validFrom')} value={item.validFrom}
            onChange={set('validFrom')} />
          <TextField path={path('validTo')} type="date" label={t('planner.logistics.validTo')} value={item.validTo}
            onChange={set('validTo')} />
        </Row>
      ) : (
        <>
          <Row>
            <TextField path={path('from')} label={t('planner.logistics.from')} value={item.from} onChange={set('from')} />
            <TextField path={path('to')} label={t('planner.logistics.to')} value={item.to} onChange={set('to')} />
          </Row>
          <DateTimeField path={path('departure')} label={t('logistics.departure')} timeLabel={t('planner.logistics.departureTime')}
            value={item.departure} onChange={set('departure')} />
          <TextField path={path('departureTimezone')} label={t('planner.logistics.departureTimezone')}
            hint={t('planner.hint.otherTimezone', { timezone: trip.trip.timezone })} suggestions={timezones}
            value={item.departureTimezone} onChange={set('departureTimezone')} />
          <DateTimeField path={path('arrival')} label={t('logistics.arrival')} timeLabel={t('planner.logistics.arrivalTime')}
            value={item.arrival} onChange={set('arrival')} />
          <TextField path={path('arrivalTimezone')} label={t('planner.logistics.arrivalTimezone')}
            hint={t('planner.hint.otherTimezone', { timezone: trip.trip.timezone })} suggestions={timezones}
            value={item.arrivalTimezone} onChange={set('arrivalTimezone')} />
        </>
      )}
      <NumberField path={path('price')} label={t('planner.stop.price', { currency: trip.trip.currency })}
        value={item.price} onChange={set('price')} />
      <TextField path={path('url')} type="url" label={t('planner.place.url')} placeholder="https://" value={item.url} onChange={set('url')} />
      <TextField path={path('notes')} label={t('planner.place.notes')} rows={3} value={item.notes} onChange={set('notes')} />
    </>
  )
}

export function ReservationFields({ index }: { index: number }) {
  const { t } = useI18n()
  const { trip, item, path, set } = useItem('reservations', index)
  const places = usePlaceOptions()
  const stops = trip.days.flatMap((day, d) => day.stops.flatMap((stop, s) => (stop.bookedId === item.id ? [[d, s]] : [])))
  return (
    <>
      <TextField path={path('title')} label={t('planner.audio.title')} required value={item.title} onChange={set('title')} />
      <SelectField path={path('placeId')} label={t('planner.logistics.place')} empty={t('planner.logistics.noPlace')}
        options={places} value={item.placeId} onChange={set('placeId')} />
      <Row>
        <TextField path={path('date')} type="date" label={t('planner.day.date')} required value={item.date} onChange={set('date')} />
        <TextField path={path('time')} type="time" label={t('planner.stop.time')} value={item.time} onChange={set('time')} />
      </Row>
      <Row>
        <NumberField path={path('partySize')} integer label={t('logistics.partySize')} value={item.partySize} onChange={set('partySize')} />
        <NumberField path={path('price')} label={t('planner.stop.price', { currency: trip.trip.currency })}
          value={item.price} onChange={set('price')} />
      </Row>
      <TextField path={path('url')} type="url" label={t('planner.place.url')} placeholder="https://" value={item.url} onChange={set('url')} />
      <TextField path={path('notes')} label={t('planner.place.notes')} rows={3} value={item.notes} onChange={set('notes')} />
      <p>
        {stops.length
          ? stops.map(([d, s]) => t('planner.logistics.bookedBy', { day: t('itinerary.dayNumber', { n: d + 1 }), stop: s + 1 })).join(' · ')
          : t('planner.logistics.notBooked')}
      </p>
    </>
  )
}
