import type { ComponentType } from 'react'
import { NavLink, useMatch } from 'react-router'
import { useI18n, type MessageKey } from '../i18n/i18n.ts'
import { BudgetIcon, ItineraryIcon, LogisticsIcon, PlacesIcon } from './icons.tsx'
import styles from './TabBar.module.css'

export interface Tab {
  /** Path relative to the current route. */
  to: string
  label: MessageKey
  Icon: ComponentType
  /** Active only on that exact path, not on the paths below it. */
  end?: boolean
}

// Paths relative to the trip route (`/:slug`); see the child routes in App.tsx.
// Only the itinerary (index) matches exactly, so Places stays active on `places/:placeId`.
const tripTabs: Tab[] = [
  { to: '.', label: 'nav.itinerary', Icon: ItineraryIcon },
  { to: 'places', label: 'nav.places', Icon: PlacesIcon },
  { to: 'logistics', label: 'nav.logistics', Icon: LogisticsIcon },
  { to: 'budget', label: 'nav.budget', Icon: BudgetIcon },
]

/** Fixed bottom navigation between the sections of a page: the trip ones by default. */
export default function TabBar({ tabs, label = 'nav.tabs' }: { tabs?: Tab[]; label?: MessageKey }) {
  const { t } = useI18n()
  // the itinerary tab (`.`) also covers the day pages: there it matches as a prefix
  const onDay = useMatch('/:slug/day/*') !== null
  const shown = tabs ?? tripTabs.map((tab) => ({ ...tab, end: tab.to === '.' && !onDay }))
  return (
    <nav className={styles.tabBar} aria-label={t(label)}>
      <ul className={styles.tabs}>
        {shown.map(({ to, label, Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={({ isActive }) => (isActive ? `${styles.tab} ${styles.active}` : styles.tab)}>
              <Icon />
              <span>{t(label)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
