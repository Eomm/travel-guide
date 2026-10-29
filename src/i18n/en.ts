import type { Messages } from './i18n.ts'

// English UI strings: same keys as `it.ts` (a missing or extra key is a type error).
export const en: Messages = {
  // common
  'common.loading': 'Loading…',
  'common.comingSoon': 'Coming soon.',
  'common.language': 'Language',

  // nav
  'nav.allTrips': 'All trips',
  'nav.tabs': 'Trip sections',
  'nav.itinerary': 'Itinerary',
  'nav.places': 'Places',
  'nav.logistics': 'Logistics',
  'nav.budget': 'Budget',

  // home
  'home.title': 'Travel Guide',
  'home.loadError': 'Cannot load the trips: {message}',
  'home.empty': 'No trips yet.',
  'home.days.one': '{count} day',
  'home.days.other': '{count} days',

  // trip
  'trip.loadError': 'Cannot load the trip: {message}',
  'trip.notFound': 'Trip not found',

  // itinerary
  'itinerary.title': 'Itinerary',

  // places
  'places.title': 'Places',

  // logistics
  'logistics.title': 'Logistics',

  // budget
  'budget.title': 'Budget',

  // not found
  'notFound.title': 'Page not found',
  'notFound.backHome': 'Back to home',
}
