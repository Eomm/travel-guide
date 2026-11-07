import { travelModes } from '../../../components/travel-icons.ts'
import { useI18n } from '../../../i18n/i18n.ts'
import { setField } from '../../../model/edit.ts'
import type { Travel } from '../../../model/trip.gen.ts'
import { usePlanner } from '../../../planner/planner.ts'
import { NumberField, Row, SelectField, TextField } from '../form/Fields.tsx'

interface Props {
  /** Issue path of the travel, e.g. `days[0].stops[1].travel`. */
  path: string
  /** Label of the mode: where the travel starts from. */
  modeLabel: string
  value: Travel | undefined
  onChange: (value: Travel | undefined) => void
}

/** How to get somewhere: the mode first (none removes the travel), then duration, distance, price, line, notes. */
export default function TravelFields({ path, modeLabel, value: travel, onChange }: Props) {
  const { t } = useI18n()
  const { trip } = usePlanner()
  const at = (field: string) => `${path}.${field}`
  const set = <K extends keyof Travel>(field: K) => (v: Travel[K] | undefined) => travel && onChange(setField(travel, field, v))
  return (
    <>
      <SelectField path={at('mode')} label={modeLabel} empty={t('planner.leg.none')} value={travel?.mode}
        options={travelModes.map((mode) => ({ value: mode, label: t(`itinerary.mode.${mode}`) }))}
        onChange={(mode) => onChange(mode && { ...travel, mode })} />
      {travel && (
        <>
          <Row>
            <NumberField path={at('durationMin')} integer label={t('planner.leg.duration')} value={travel.durationMin}
              onChange={set('durationMin')} />
            <NumberField path={at('distanceKm')} label={t('planner.leg.distance')} hint={t('planner.hint.distance')}
              value={travel.distanceKm} onChange={set('distanceKm')} />
          </Row>
          <Row>
            <NumberField path={at('price')} label={t('planner.leg.price', { currency: trip.trip.currency })}
              value={travel.price} onChange={set('price')} />
            <TextField path={at('line')} label={t('planner.leg.line')} placeholder="JR Sanyo Line"
              value={travel.line} onChange={set('line')} />
          </Row>
          <TextField path={at('notes')} label={t('planner.leg.notes')} rows={2} value={travel.notes} onChange={set('notes')} />
        </>
      )}
    </>
  )
}
