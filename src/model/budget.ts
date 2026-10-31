// Budget rules from schema/README.md ("Budget rules"). All amounts are in trip.currency.
import { dayEndPoint, stopPoint } from './points.ts'
import type { Day, Stop, Travel, Trip } from './trip.gen.ts'

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
  time?: string
  /** The stop, or the end of the day. */
  name: string
  /** Set when the travel leg to reach `name` has no price; undefined when the stop cost is unknown. */
  leg?: Travel['mode']
}

/** A non-walk leg without a price. */
const unpricedLeg = (travel?: Travel) => travel && travel.mode !== 'walk' && travel.price === undefined

/** Unknown costs, so the total is a lower bound: stops without a cost and non-walk legs (end of day too) without a price. */
export function missingPrices(trip: Trip): MissingPrice[] {
  return trip.days.flatMap((day) => {
    const missing = day.stops.flatMap((stop) => {
      const item = { date: day.date, time: stop.time, name: stopPoint(stop, trip).name }
      const found: MissingPrice[] = []
      if (unpricedLeg(stop.travel)) found.push({ ...item, leg: stop.travel?.mode })
      if (stopCost(stop, trip) === undefined) found.push(item)
      return found
    })
    if (unpricedLeg(day.end?.travel)) {
      const name = dayEndPoint(day, trip)?.point.name ?? ''
      missing.push({ date: day.date, time: day.end?.time, name, leg: day.end?.travel?.mode })
    }
    return missing
  })
}
