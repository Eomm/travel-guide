// `/plan/:slug/days`: the itinerary, day after day. Add a day, then its stops: an existing place or a new one,
// and how to get from one stop to the next. Stops are dragged between days and the wishlist.
import { PlusIcon } from '../../components/icons.tsx'
import { useI18n } from '../../i18n/i18n.ts'
import { addDay } from '../../model/edit.ts'
import { todayIn } from '../../model/today.ts'
import { usePlanner } from '../../planner/planner.ts'
import DayDnd from './days/DayDnd.tsx'
import DayEditor from './days/DayEditor.tsx'
import styles from './days/Days.module.css'
import { OpenContext, openKeyFor } from './days/open.ts'
import Wishlist from './days/Wishlist.tsx'
import { useIssueFocus } from './form/fields.ts'
import { useOpenSet } from './form/open-set.ts'

/** Today in the trip timezone, or in the browser one while the trip timezone is not valid. */
function today(timezone: string) {
  try {
    return todayIn(timezone)
  } catch {
    return todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }
}

export default function Days() {
  const { t } = useI18n()
  const { trip, update } = usePlanner()
  const editors = useOpenSet((path) => openKeyFor(path, trip))
  useIssueFocus()

  return (
    <>
      <h1>{t('planner.days')}</h1>
      {trip.days.length === 0 && <p className={styles.empty}>{t('planner.noDays')}</p>}
      <OpenContext value={editors}>
        <DayDnd>
          <Wishlist />
          <ol className={styles.days}>
            {trip.days.map((_, d) => (
              <li key={d}>
                <DayEditor index={d} />
              </li>
            ))}
          </ol>
        </DayDnd>
      </OpenContext>
      <button type="button" className={styles.addDay} onClick={() => update((current) => addDay(current, today(current.trip.timezone)))}>
        <PlusIcon />
        {t('planner.addDay')}
      </button>
    </>
  )
}
