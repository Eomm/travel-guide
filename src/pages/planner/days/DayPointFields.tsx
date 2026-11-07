import { useState } from 'react'
import { useI18n } from '../../../i18n/i18n.ts'
import { setField, updateDay, withoutUndefined } from '../../../model/edit.ts'
import type { DayEnd, DayStart } from '../../../model/trip.gen.ts'
import { usePlanner } from '../../../planner/planner.ts'
import { Group, NumberField, Row, SelectField, TextField } from '../form/Fields.tsx'
import TravelFields from './TravelFields.tsx'

type Which = 'start' | 'end'
type Kind = 'accommodation' | 'place' | 'point'

/** What the point is, from its fields: none of them is the default (the accommodation of the night). */
function kindOf(point: DayStart | DayEnd | undefined): Kind | undefined {
  if (point?.accommodationId !== undefined) return 'accommodation'
  if (point?.placeId !== undefined) return 'place'
  if (point && ['title', 'address', 'lat', 'lng'].some((key) => key in point)) return 'point'
  return undefined
}

/** The fields of the point minus where it is: what a new choice of kind keeps. */
const keep = ({ time, notes, travel }: DayEnd) => withoutUndefined({ time, notes, travel })

/** Where a day starts or ends: the default, an accommodation, a catalog place or another point; and when. */
export default function DayPointFields({ dayIndex, which }: { dayIndex: number; which: Which }) {
  const { t } = useI18n()
  const { trip, update } = usePlanner()
  const point: DayEnd | undefined = trip.days[dayIndex][which]
  // a kind chosen and not filled in yet has no field to tell it
  const [chosen, setChosen] = useState<Kind>()
  const kind = kindOf(point) ?? chosen
  const path = (key: string) => `days[${dayIndex}].${which}.${key}`

  const setPoint = (next: DayEnd | undefined) =>
    update((current) => updateDay(current, dayIndex, (day) => {
      const value = next && Object.keys(next).length ? next : undefined
      return setField(day, which, value)
    }))
  const set = <K extends keyof DayEnd>(key: K) => (value: DayEnd[K] | undefined) => setPoint(setField(point ?? {}, key, value))
  const changeKind = (next: Kind | undefined) => {
    setChosen(next)
    setPoint(point && keep(point))
  }

  return (
    <Group title={t(which === 'start' ? 'planner.day.start' : 'planner.day.end')}>
      {/* the path of the whole point: its own issues show here */}
      <SelectField path={`days[${dayIndex}].${which}`}
        label={t('planner.day.where')} empty={t(which === 'start' ? 'planner.day.startDefault' : 'planner.day.endDefault')}
        options={[
          { value: 'accommodation', label: t('planner.day.atAccommodation') },
          { value: 'place', label: t('planner.day.atPlace') },
          { value: 'point', label: t('planner.day.atPoint') },
        ]}
        value={kind} onChange={changeKind} />
      {kind === 'accommodation' && (
        <SelectField path={path('accommodationId')} label={t('logistics.accommodations')} empty="–"
          options={(trip.logistics?.accommodations ?? []).map((a) => ({ value: a.id, label: a.name || a.id }))}
          hint={trip.logistics?.accommodations?.length ? undefined : t('planner.hint.noAccommodations')}
          value={point?.accommodationId} onChange={set('accommodationId')} />
      )}
      {kind === 'place' && (
        <SelectField path={path('placeId')} label={t('planner.stop.place')} empty="–"
          options={trip.places.map((p) => ({ value: p.id, label: p.name || p.id }))}
          value={point?.placeId} onChange={set('placeId')} />
      )}
      {kind === 'point' && (
        <>
          <TextField path={path('title')} label={t('planner.stop.title')} value={point?.title} onChange={set('title')} />
          <TextField path={path('address')} label={t('planner.place.address')} value={point?.address} onChange={set('address')} />
          <Row>
            <NumberField path={path('lat')} label={t('planner.place.lat')} value={point?.lat} onChange={set('lat')} />
            <NumberField path={path('lng')} label={t('planner.place.lng')} value={point?.lng} onChange={set('lng')} />
          </Row>
        </>
      )}
      <TextField path={path('time')} type="time" label={t(which === 'start' ? 'planner.day.startTime' : 'planner.day.endTime')}
        value={point?.time} onChange={set('time')} />
      {which === 'end' && (
        <TravelFields path={path('travel')} modeLabel={t('planner.day.endTravel')} value={point?.travel} onChange={set('travel')} />
      )}
    </Group>
  )
}
