import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router'
import { useTrip } from '../../../data/trip-context.ts'
import { useI18n } from '../../../i18n/i18n.ts'
import { formatDate } from '../../../model/format.ts'
import { todayIn } from '../../../model/today.ts'
import styles from './DayTabs.module.css'

/** Horizontally scrollable tabs, one per day; the active one is scrolled into view. */
export default function DayTabs({ active }: { active?: string }) {
  const { slug, trip } = useTrip()
  const { lang, t } = useI18n()
  const bar = useRef<HTMLElement>(null)
  const today = todayIn(trip.trip.timezone)

  useEffect(() => {
    const scroller = bar.current
    const tab = scroller?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!scroller || !tab) return
    // horizontal only: scrollIntoView would also move the page
    scroller.scrollLeft = tab.offsetLeft - (scroller.clientWidth - tab.offsetWidth) / 2
  }, [active])

  return (
    <nav ref={bar} className={styles.bar} aria-label={t('itinerary.days')}>
      <ul className={styles.chips}>
        {trip.days.map((day, i) => (
          <li key={day.date}>
            <NavLink to={`/${slug}/day/${day.date}`}
              className={({ isActive }) => (isActive ? `${styles.chip} ${styles.active}` : styles.chip)}>
              <span className={styles.date}>{formatDate(day.date, lang, 'short')}</span>
              <span className={styles.number}>
                {t('itinerary.dayNumber', { n: i + 1 })}
                {day.date === today && <>{' '}<span className={styles.today}>{t('itinerary.today')}</span></>}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
