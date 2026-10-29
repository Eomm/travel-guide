import type { ComponentType } from 'react'
import { NavLink } from 'react-router'
import { useI18n, type MessageKey } from '../i18n/i18n.ts'
import { BudgetIcon, ItineraryIcon, LogisticsIcon, PlacesIcon } from './icons.tsx'
import styles from './TabBar.module.css'

// Paths relative to the trip route (`/:slug`); see the child routes in App.tsx.
const tabs: { to: string; label: MessageKey; Icon: ComponentType }[] = [
  { to: '.', label: 'nav.itinerary', Icon: ItineraryIcon },
  { to: 'places', label: 'nav.places', Icon: PlacesIcon },
  { to: 'logistics', label: 'nav.logistics', Icon: LogisticsIcon },
  { to: 'budget', label: 'nav.budget', Icon: BudgetIcon },
]

/** Fixed bottom navigation between the sections of a trip. */
export default function TabBar() {
  const { t } = useI18n()
  return (
    <nav className={styles.tabBar} aria-label={t('nav.tabs')}>
      <ul className={styles.tabs}>
        {tabs.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink to={to} end className={({ isActive }) => (isActive ? `${styles.tab} ${styles.active}` : styles.tab)}>
              <Icon />
              <span>{t(label)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
