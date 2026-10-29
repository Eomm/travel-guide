import { useI18n } from '../../../i18n/i18n.ts'
import { formatDate } from '../../../model/format.ts'
import type { Day } from '../../../model/trip.gen.ts'
import styles from './DayJumpBar.module.css'
import { dayAnchor } from './labels.ts'

/** Horizontally scrollable chips, one per day, linking to the day sections. */
export default function DayJumpBar({ days }: { days: Day[] }) {
  const { lang, t } = useI18n()
  return (
    <nav className={styles.bar} aria-label={t('itinerary.jumpTo')}>
      <ul className={styles.chips}>
        {days.map((day) => (
          <li key={day.date}>
            <a className={styles.chip} href={`#${dayAnchor(day)}`}>
              {formatDate(day.date, lang, 'short')}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
