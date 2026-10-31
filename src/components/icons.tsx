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

// travel modes (itinerary)

export const WalkIcon = () => (
  <Icon>
    <circle cx="13" cy="4" r="2" />
    <path d="M9 21l2-6 3 3v3M7 12l2-4 4-1 2 4 3 1M11 15l1-5" />
  </Icon>
)

export const TrainIcon = () => (
  <Icon>
    <rect x="5" y="3" width="14" height="14" rx="3" />
    <path d="M5 11h14M9 14h.01M15 14h.01M8 21l2-4M16 21l-2-4" />
  </Icon>
)

export const BusIcon = () => (
  <Icon>
    <rect x="4" y="3" width="16" height="15" rx="2" />
    <path d="M4 11h16M8 15h.01M16 15h.01M7 18v3M17 18v3" />
  </Icon>
)

export const FerryIcon = () => (
  <Icon>
    <path d="M3 18c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0M5 15l-1-4h16l-1 4M7 11V7h10v4M12 7V4" />
  </Icon>
)

export const CarIcon = () => (
  <Icon>
    <path d="M5 16H3v-4l2-5h14l2 5v4h-2M3 12h18" />
    <circle cx="7.5" cy="16.5" r="1.5" />
    <circle cx="16.5" cy="16.5" r="1.5" />
    <path d="M9 16.5h6" />
  </Icon>
)

export const BikeIcon = () => (
  <Icon>
    <circle cx="6" cy="16" r="4" />
    <circle cx="18" cy="16" r="4" />
    <path d="M6 16l4-7h6l2 7M10 9l4 7M9 6h3" />
  </Icon>
)

export const FlightIcon = () => (
  <Icon>
    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </Icon>
)

export const RouteIcon = () => (
  <Icon>
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="5" r="2" />
    <path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16" />
  </Icon>
)

export const FlagIcon = () => (
  <Icon>
    <path d="M5 21V4M5 4h12l-2.5 4.5L17 13H5" />
  </Icon>
)

export const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4" />
  </Icon>
)

export const FilterIcon = () => (
  <Icon>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Icon>
)

export const GlobeIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </Icon>
)

export const TicketIcon = () => (
  <Icon>
    <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7z" />
    <path d="M14 7v10" strokeDasharray="2 2" />
  </Icon>
)

export const PhoneIcon = () => (
  <Icon>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </Icon>
)

export const HotelIcon = () => (
  <Icon>
    <path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6" />
    <circle cx="7" cy="11" r="2" />
  </Icon>
)

export const BookingIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4M9 15.5l2 2 4-4" />
  </Icon>
)

export const ExternalIcon = () => (
  <Icon>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Icon>
)

export const HeartIcon = () => (
  <Icon>
    <path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.2 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />
  </Icon>
)

export const CloseIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
)

export const WarningIcon = () => (
  <Icon>
    <path d="M12 3L2 20h20L12 3z" />
    <path d="M12 10v4M12 17h.01" />
  </Icon>
)
