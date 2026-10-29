// Inline SVG icons (24×24, stroke in currentColor), decorative: label the control that contains them.
import type { ReactNode } from 'react'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

export const BackIcon = () => (
  <Icon>
    <path d="M15 18l-6-6 6-6" />
  </Icon>
)

export const ItineraryIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Icon>
)

export const PlacesIcon = () => (
  <Icon>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icon>
)

export const LogisticsIcon = () => (
  <Icon>
    <rect x="4" y="7" width="16" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13h16" />
  </Icon>
)

export const BudgetIcon = () => (
  <Icon>
    <path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7zm0 0V6a2 2 0 0 1 2-2h10v3" />
    <circle cx="16" cy="13.5" r="1" />
  </Icon>
)
