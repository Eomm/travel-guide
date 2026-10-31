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
  'itinerary.empty': 'No days planned yet.',
  'itinerary.stopsOf': 'Stops of {date}',
  'itinerary.start': 'Start',
  'itinerary.fromStay': 'from {name}',
  'itinerary.booked': 'Booked',
  'itinerary.maps': 'Maps',
  'itinerary.mapsOf': 'Open {name} in Google Maps',
  'itinerary.directions': 'Directions',
  'itinerary.directionsTo': 'Directions to {name}',
  'itinerary.km': '{km} km',
  'itinerary.kmEstimated': '≈ {km} km',
  'itinerary.recap': 'Day recap',
  'itinerary.stopCount': 'Stops',
  'itinerary.dayTotal': 'Total',
  'itinerary.walking': 'Walking',
  'itinerary.mode.walk': 'Walk',
  'itinerary.mode.train': 'Train',
  'itinerary.mode.subway': 'Subway',
  'itinerary.mode.bus': 'Bus',
  'itinerary.mode.tram': 'Tram',
  'itinerary.mode.ferry': 'Ferry',
  'itinerary.mode.taxi': 'Taxi',
  'itinerary.mode.car': 'Car',
  'itinerary.mode.bike': 'Bike',
  'itinerary.mode.flight': 'Flight',
  'itinerary.mode.other': 'Transfer',
  'itinerary.category.see': 'Sights',
  'itinerary.category.food': 'Food',
  'itinerary.category.shop': 'Shopping',
  'itinerary.category.fun': 'Fun',
  'itinerary.category.hotel': 'Stay',
  'itinerary.category.info': 'Info',
  'itinerary.days': 'Trip days',
  'itinerary.dayNumber': 'Day {n}',
  'itinerary.dayNotFound': 'The day {date} is not in the plan.',
  'itinerary.openDayInMaps': 'Open the day in Google Maps',
  'itinerary.dayNav': 'Previous and next day',
  'itinerary.previousDay': 'Previous day',
  'itinerary.nextDay': 'Next day',
  'itinerary.map': 'Map of the day',
  'itinerary.showMap': 'Show map',
  'itinerary.hideMap': 'Hide map',
  'itinerary.mapUnavailable': 'Map not available right now.',
  'itinerary.end': 'Arrival',
  'itinerary.endStay': 'your accommodation',
  'itinerary.endNextStart': "next day's start",

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
