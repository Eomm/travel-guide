import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronIcon, TrashIcon } from '../../../components/icons.tsx'
import { useI18n } from '../../../i18n/i18n.ts'
import { isDate, removeDay, setField, updateDay } from '../../../model/edit.ts'
import { formatDate } from '../../../model/format.ts'
import type { Day } from '../../../model/trip.gen.ts'
import { usePlanner } from '../../../planner/planner.ts'
import { fieldId } from '../form/fields.ts'
import { IssueList, TextField } from '../form/Fields.tsx'
import AddStop from './AddStop.tsx'
import styles from './Days.module.css'
import DayPointFields from './DayPointFields.tsx'
import { dayDropId, stopDragId } from './dnd.ts'
import LegEditor from './LegEditor.tsx'
import { dayKey, useOpen } from './open.ts'
import StopEditor from './StopEditor.tsx'

/** One day of the itinerary: its title, its stops with the travel between them, and a way to add more. */
export default function DayEditor({ index }: { index: number }) {
  const { lang, t } = useI18n()
  const { trip, update } = usePlanner()
  const { isOpen, toggle, closeAll } = useOpen()
  const day = trip.days[index]
  const details = isOpen(dayKey(index))
  const { setNodeRef, isOver } = useDroppable({ id: dayDropId(index) })
  const path = (key: string) => `days[${index}].${key}`
  const set = <K extends keyof Day>(key: K) => (value: Day[K] | undefined) =>
    update((current) => updateDay(current, index, (d) => setField(d, key, value)))

  const remove = () => {
    const name = t('itinerary.dayNumber', { n: index + 1 })
    if (day.stops.length && !window.confirm(t(day.stops.length === 1 ? 'planner.removeDayConfirm.one' : 'planner.removeDayConfirm.other', { name, count: day.stops.length }))) return
    closeAll()
    update((current) => removeDay(current, index))
  }

  return (
    // tabIndex: the target of an issue on the whole day
    <section id={fieldId(dayKey(index))} tabIndex={-1} className={styles.day} aria-labelledby={`day-${index}`}>
      <div className={styles.dayHead}>
        <h2 id={`day-${index}`} className={styles.dayTitle}>
          {t('itinerary.dayNumber', { n: index + 1 })}
          {isDate(day.date) && <span className={styles.date}>{formatDate(day.date, lang, 'short')}</span>}
        </h2>
        <button type="button" className={styles.iconButton} aria-expanded={details} onClick={() => toggle(dayKey(index))}
          aria-label={t('planner.dayDetails')} title={t('planner.dayDetails')}>
          <ChevronIcon open={details} />
        </button>
        <button type="button" className={`${styles.iconButton} ${styles.danger}`} onClick={remove}
          aria-label={t('planner.removeDay')} title={t('planner.removeDay')}>
          <TrashIcon />
        </button>
      </div>
      <IssueList path={dayKey(index)} />
      <TextField path={path('title')} label={t('planner.day.title')} placeholder={t('planner.day.titlePlaceholder')}
        value={day.title} onChange={set('title')} />
      {details && (
        <div className={styles.details}>
          <TextField path={path('date')} type="date" label={t('planner.day.date')} required value={day.date} onChange={set('date')} />
          <TextField path={path('notes')} label={t('planner.day.notes')} hint={t('planner.hint.markdown')} rows={3}
            value={day.notes} onChange={set('notes')} />
          <DayPointFields dayIndex={index} which="start" />
          <DayPointFields dayIndex={index} which="end" />
        </div>
      )}
      {/* also the drop target of the stops dropped below the last one, or into an empty day */}
      <SortableContext items={day.stops.map((_, s) => stopDragId(index, s))} strategy={verticalListSortingStrategy}>
        <ol ref={setNodeRef} className={isOver ? `${styles.stops} ${styles.over}` : styles.stops}>
          {day.stops.map((_, s) => (
            <StopEditor key={s} dayIndex={index} stopIndex={s} leg={<LegEditor dayIndex={index} stopIndex={s} />} />
          ))}
        </ol>
      </SortableContext>
      <AddStop dayIndex={index} />
    </section>
  )
}
