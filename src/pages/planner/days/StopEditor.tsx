import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'
import { ChevronIcon, GripIcon, TrashIcon } from '../../../components/icons.tsx'
import { useI18n } from '../../../i18n/i18n.ts'
import { removeStop, setField, updateStop } from '../../../model/edit.ts'
import { formatDuration } from '../../../model/format.ts'
import { stopPoint } from '../../../model/points.ts'
import type { Stop, Trip } from '../../../model/trip.gen.ts'
import { usePlanner } from '../../../planner/planner.ts'
import { fieldId } from '../form/fields.ts'
import AudioTracks from '../form/AudioTracks.tsx'
import { IssueList, NumberField, Row, SelectField, TextField } from '../form/Fields.tsx'
import PlaceFields from '../places/PlaceFields.tsx'
import styles from './Days.module.css'
import { stopDragId } from './dnd.ts'
import { stopKey, useOpen } from './open.ts'

/** The first open stop of the place `placeId`, as `[day index, stop index]`. */
function firstOpenStop(trip: Trip, placeId: string, isOpen: (key: string) => boolean): [number, number] | undefined {
  for (const [d, day] of trip.days.entries()) {
    const s = day.stops.findIndex((stop, i) => stop.placeId === placeId && isOpen(stopKey(d, i)))
    if (s >= 0) return [d, s]
  }
  return undefined
}

/** A stop: one line with time and name, which opens to its fields and to the fields of its place. */
export default function StopEditor({ dayIndex, stopIndex, leg }: { dayIndex: number; stopIndex: number; leg: ReactNode }) {
  const { lang, t } = useI18n()
  const { trip, update, issuesAt } = usePlanner()
  const { isOpen, toggle, closeAll } = useOpen()
  const key = stopKey(dayIndex, stopIndex)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: stopDragId(dayIndex, stopIndex) })
  const open = isOpen(key)
  const stop = trip.days[dayIndex].stops[stopIndex]
  const placeIndex = trip.places.findIndex((p) => p.id === stop.placeId)
  const place = trip.places[placeIndex] as (typeof trip.places)[number] | undefined
  const uses = place ? trip.days.reduce((n, day) => n + day.stops.filter((s) => s.placeId === place.id).length, 0) : 0
  // a place open in two stops would have its fields twice, with the same ids: the first open stop edits it
  const editedIn = place && firstOpenStop(trip, place.id, isOpen)
  const name = stopPoint(stop, trip).name || t('planner.stop.unnamed')
  const hasError = [...issuesAt(key), ...(place ? issuesAt(`places[${placeIndex}]`) : [])].some((i) => i.error)

  const path = (field: string) => `${key}.${field}`
  const set = <K extends keyof Stop>(field: K) => (value: Stop[K] | undefined) =>
    update((current) => updateStop(current, dayIndex, stopIndex, (s) => setField(s, field, value)))
  // a booking gives its time to a stop without one
  const book = (bookedId: string | undefined) => {
    const time = trip.logistics?.reservations?.find((r) => r.id === bookedId)?.time
    update((current) => updateStop(current, dayIndex, stopIndex, (s) =>
      setField(setField(s, 'bookedId', bookedId), 'time', s.time ?? time)))
  }
  const remove = () => {
    closeAll()
    update((current) => removeStop(current, dayIndex, stopIndex))
  }

  return (
    // the leg moves with its stop: it is how to reach it
    <li ref={setNodeRef} className={isDragging ? styles.dragging : undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}>
      {leg}
      <article className={open ? `${styles.stop} ${styles.open}` : styles.stop}>
        <div className={styles.stopRow}>
          <button type="button" ref={setActivatorNodeRef} className={styles.handle} {...attributes} {...listeners}
            aria-label={t('planner.dnd.dragStop', { name })} title={t('planner.dnd.dragStop', { name })}>
            <GripIcon />
          </button>
          {/* the target of an issue on the whole stop */}
          <button type="button" id={fieldId(key)} className={styles.stopHead} aria-expanded={open} onClick={() => toggle(key)}>
            <span className={styles.number}>{stopIndex + 1}</span>
            <span className={styles.stopInfo}>
              {stop.time && <span className={styles.time}>{stop.time}</span>}
              <span className={styles.stopName}>{name}</span>
              {stop.durationMin !== undefined && <span className={styles.meta}>{formatDuration(stop.durationMin, lang)}</span>}
              {stop.bookedId && <span className={styles.badge}>{t('itinerary.booked')}</span>}
              {hasError && !open && <span className={styles.errorDot} role="img" aria-label={t('planner.hasErrors')} />}
            </span>
            <ChevronIcon open={open} />
          </button>
        </div>
        {open && (
          <div className={styles.stopBody}>
            <IssueList path={key} />
            <Row>
              <TextField path={path('time')} type="time" label={t('planner.stop.time')} value={stop.time} onChange={set('time')} />
              <NumberField path={path('durationMin')} integer label={t('planner.stop.duration')} value={stop.durationMin}
                onChange={set('durationMin')} />
            </Row>
            <NumberField path={path('price')} label={t('planner.stop.price', { currency: trip.trip.currency })}
              hint={place?.price !== undefined ? t('planner.hint.stopPrice', { price: place.price }) : undefined}
              placeholder={place?.price !== undefined ? String(place.price) : undefined}
              value={stop.price} onChange={set('price')} />
            <TextField path={path('title')} label={t('planner.stop.title')}
              hint={t(place ? 'planner.hint.stopTitle' : 'planner.hint.stopTitleFree')} value={stop.title} onChange={set('title')} />
            <SelectField path={path('bookedId')} label={t('planner.stop.reservation')} empty={t('planner.stop.notBooked')}
              hint={t('planner.hint.stopReservation')}
              options={(trip.logistics?.reservations ?? []).map((r) => ({
                value: r.id,
                label: [r.title || r.id, r.date, r.time].filter(Boolean).join(' · '),
              }))}
              value={stop.bookedId} onChange={book} />
            <TextField path={path('notes')} label={t('planner.stop.notes')} hint={t('planner.hint.markdown')} rows={3}
              value={stop.notes} onChange={set('notes')} />
            <AudioTracks path={path('audio')} value={stop.audio} onChange={set('audio')} />
            {place && (
              <fieldset className={styles.place}>
                <legend>{t('planner.stop.place')}</legend>
                {uses > 1 && <p className={styles.hint}>{t('planner.hint.sharedPlace', { count: uses })}</p>}
                {editedIn && (editedIn[0] !== dayIndex || editedIn[1] !== stopIndex) ? (
                  <p className={styles.hint}>
                    {t('planner.hint.placeEditedIn', {
                      day: t('itinerary.dayNumber', { n: editedIn[0] + 1 }),
                      stop: editedIn[1] + 1,
                    })}
                  </p>
                ) : (
                  <PlaceFields index={placeIndex} />
                )}
              </fieldset>
            )}
            <button type="button" className={styles.remove} onClick={remove}>
              <TrashIcon />
              {t('planner.removeStop')}
            </button>
          </div>
        )}
      </article>
    </li>
  )
}
