// Budget rules from schema/README.md ("Budget rules"). All amounts are in trip.currency.
import type { Day, Stop, Trip } from './trip.gen.ts'

/** Price of the booked reservation, else the stop price, else the place price; undefined when unknown. */
export function stopCost(stop: Stop, trip: Trip): number | undefined {
  const reservation = trip.logistics?.reservations?.find((r) => r.id === stop.bookedId)
  if (reservation?.price !== undefined) return reservation.price
  if (stop.price !== undefined) return stop.price
  return trip.places.find((p) => p.id === stop.placeId)?.price
}

const sum = (values: (number | undefined)[]) => values.reduce<number>((total, value) => total + (value ?? 0), 0)

export interface DayCost {
  stops: number
  travel: number
  total: number
}

/** Stops and travel of one day, including the travel to the end of the day. */
export function dayCost(day: Day, trip: Trip): DayCost {
  const stops = sum(day.stops.map((stop) => stopCost(stop, trip)))
  const travel = sum([...day.stops.map((stop) => stop.travel?.price), day.end?.travel?.price])
  return { stops, travel, total: stops + travel }
}

export interface TripCost {
  days: number
  accommodations: number
  transports: number
  /** Reservations not referenced by any stop (the others are counted in their stop). */
  reservations: number
  total: number
}

export function tripCost(trip: Trip): TripCost {
  const { accommodations = [], transports = [], reservations = [] } = trip.logistics ?? {}
  const booked = new Set(trip.days.flatMap((day) => day.stops.map((stop) => stop.bookedId)))
  const cost = {
    days: sum(trip.days.map((day) => dayCost(day, trip).total)),
    accommodations: sum(accommodations.map((a) => a.price)),
    transports: sum(transports.map((t) => t.price)),
    reservations: sum(reservations.filter((r) => !booked.has(r.id)).map((r) => r.price)),
  }
  return { ...cost, total: cost.days + cost.accommodations + cost.transports + cost.reservations }
}

export interface MissingPrice {
  date: string
  stop: Stop
  /** true: the travel leg to reach `stop` has no price; false: the stop cost is unknown. */
  leg: boolean
}

/** Unknown costs, so the total is a lower bound: stops without a cost and non-walk legs without a price. */
export function missingPrices(trip: Trip): MissingPrice[] {
  return trip.days.flatMap((day) =>
    day.stops.flatMap((stop) => {
      const missing: MissingPrice[] = []
      if (stop.travel && stop.travel.mode !== 'walk' && stop.travel.price === undefined) {
        missing.push({ date: day.date, stop, leg: true })
      }
      if (stopCost(stop, trip) === undefined) missing.push({ date: day.date, stop, leg: false })
      return missing
    }),
  )
}
