// The less common fields of a place: shown on demand under its main fields (PlaceFields.tsx).
import { type Lang, useI18n } from '../../../i18n/i18n.ts'
import { setField, updatePlace, withoutUndefined } from '../../../model/edit.ts'
import { locale } from '../../../model/format.ts'
import { type Weekday, weekdays } from '../../../model/places.ts'
import type { OpeningHours, Place } from '../../../model/trip.gen.ts'
import { usePlanner } from '../../../planner/planner.ts'
import AudioTracks from '../form/AudioTracks.tsx'
import { Group, ListField, SelectField, TextField } from '../form/Fields.tsx'

/** `mon` → `Monday`, in the UI language (2024-01-01 is a Monday). */
function weekdayName(day: Weekday, lang: Lang): string {
  const date = new Date(Date.UTC(2024, 0, 1 + weekdays.indexOf(day)))
  const name = new Intl.DateTimeFormat(locale(lang), { weekday: 'long', timeZone: 'UTC' }).format(date)
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** An object without keys is no object: it leaves its parent. */
const orNothing = <T extends object>(value: T): T | undefined => (Object.keys(value).length ? value : undefined)

export default function PlaceMoreFields({ index }: { index: number }) {
  const { lang, t } = useI18n()
  const { slug, trip, update } = usePlanner()
  const place = trip.places[index]
  const hours = place.openingHours ?? {}
  const path = (key: string) => `places[${index}].${key}`
  const set = <K extends keyof Place>(key: K) => (value: Place[K] | undefined) =>
    update((current) => updatePlace(current, index, (p) => setField(p, key, value)))
  const setHours = (change: Partial<OpeningHours>) =>
    set('openingHours')(orNothing(withoutUndefined({ ...hours, ...change })))
  const setWeekday = (day: Weekday) => (ranges: string[] | undefined) =>
    setHours({ weekly: orNothing(withoutUndefined({ ...hours.weekly, [day]: ranges })) })

  return (
    <>
      <SelectField path={path('status')} label={t('planner.place.status')} empty={t('planner.place.statusOpen')}
        options={[
          { value: 'closedTemporarily', label: t('places.closedTemporarily') },
          { value: 'closedPermanently', label: t('places.closedPermanently') },
        ]}
        value={place.status === 'open' ? undefined : place.status} onChange={set('status')} />
      <TextField path={path('info')} label={t('places.info')} hint={t('planner.hint.markdown')} rows={5}
        value={place.info} onChange={set('info')} />
      <TextField path={path('tip')} label={t('places.tip')} rows={2} value={place.tip} onChange={set('tip')} />
      <TextField path={path('visitDuration')} label={t('places.visitDuration')} placeholder={t('planner.place.visitDurationPlaceholder')}
        value={place.visitDuration} onChange={set('visitDuration')} />
      <TextField path={path('directions')} label={t('places.directions')} rows={2} value={place.directions}
        onChange={set('directions')} />
      <TextField path={path('bookingUrl')} type="url" label={t('planner.place.bookingUrl')} placeholder="https://"
        value={place.bookingUrl} onChange={set('bookingUrl')} />
      <TextField path={path('phone')} type="tel" label={t('planner.place.phone')} value={place.phone} onChange={set('phone')} />
      <TextField path={path('image')} label={t('planner.place.image')} hint={t('planner.hint.resource', { slug })}
        placeholder="images/museum.jpg" value={place.image} onChange={set('image')} />
      <ListField path={path('tags')} label={t('planner.place.tags')} hint={t('planner.hint.list')} placeholder="museum, history"
        value={place.tags} onChange={set('tags')} />
      <TextField path={path('icon')} label={t('planner.place.icon')} placeholder="temple" value={place.icon} onChange={set('icon')} />

      <Group title={t('places.openingHours')}>
        <TextField path={path('openingHours.text')} label={t('planner.hours.text')} hint={t('planner.hint.hoursText')}
          value={hours.text} onChange={(text) => setHours({ text })} />
        <p>{t('planner.hint.hoursWeekly')}</p>
        {weekdays.map((day) => (
          <ListField key={day} path={path(`openingHours.weekly.${day}`)} label={weekdayName(day, lang)}
            placeholder={t('places.closed')} value={hours.weekly?.[day]} onChange={setWeekday(day)} />
        ))}
        <TextField path={path('openingHours.closures')} label={t('planner.hours.closures')} value={hours.closures}
          onChange={(closures) => setHours({ closures })} />
        <ListField path={path('openingHours.closedDates')} label={t('planner.hours.closedDates')} hint={t('planner.hint.list')}
          placeholder="2027-04-29, 2027-05-03" value={hours.closedDates} onChange={(closedDates) => setHours({ closedDates })} />
      </Group>

      <AudioTracks path={path('audio')} value={place.audio} onChange={set('audio')} />
    </>
  )
}
