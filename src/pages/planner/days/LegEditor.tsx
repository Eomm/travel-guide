import { ChevronIcon, PlusIcon } from '../../../components/icons.tsx'
import { modeIcons } from '../../../components/travel-icons.ts'
import { useI18n } from '../../../i18n/i18n.ts'
import { setField, updateStop } from '../../../model/edit.ts'
import { formatDuration } from '../../../model/format.ts'
import type { Travel } from '../../../model/trip.gen.ts'
import { usePlanner } from '../../../planner/planner.ts'
import { fieldId } from '../form/fields.ts'
import styles from './Days.module.css'
import { legKey, useOpen } from './open.ts'
import TravelFields from './TravelFields.tsx'

/** The connector before a stop: how to get there from the previous stop (or from the day start). */
export default function LegEditor({ dayIndex, stopIndex }: { dayIndex: number; stopIndex: number }) {
  const { lang, t } = useI18n()
  const { trip, update } = usePlanner()
  const { isOpen, toggle } = useOpen()
  const key = legKey(dayIndex, stopIndex)
  const open = isOpen(key)
  const travel = trip.days[dayIndex].stops[stopIndex].travel
  const Icon = travel ? modeIcons[travel.mode] : PlusIcon

  const setTravel = (next: Travel | undefined) =>
    update((current) => updateStop(current, dayIndex, stopIndex, (s) => setField(s, 'travel', next)))

  const summary = travel
    ? [
        t(`itinerary.mode.${travel.mode}`),
        travel.line,
        travel.durationMin !== undefined && formatDuration(travel.durationMin, lang),
      ].filter(Boolean).join(' · ')
    : t(stopIndex === 0 ? 'planner.leg.addFromStart' : 'planner.leg.add')

  return (
    <div className={styles.leg}>
      <button type="button" id={fieldId(key)} className={travel ? styles.legHead : `${styles.legHead} ${styles.legEmpty}`}
        aria-expanded={open} onClick={() => toggle(key)}>
        <span className={styles.legIcon}><Icon /></span>
        <span className={styles.legSummary}>{summary}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className={styles.legBody}>
          <TravelFields path={key} value={travel} onChange={setTravel}
            modeLabel={t(stopIndex === 0 ? 'planner.leg.modeFromStart' : 'planner.leg.mode')} />
        </div>
      )}
    </div>
  )
}
