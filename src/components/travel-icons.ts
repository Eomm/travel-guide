// The icon of each travel mode, shared by the itinerary legs and the Planner.
import type { ComponentType } from 'react'
import type { Travel } from '../model/trip.gen.ts'
import { BikeIcon, BusIcon, CarIcon, FerryIcon, FlightIcon, RouteIcon, TrainIcon, WalkIcon } from './icons.tsx'

export const travelModes: Travel['mode'][] = [
  'walk', 'train', 'subway', 'bus', 'tram', 'ferry', 'taxi', 'car', 'bike', 'flight', 'other',
]

export const modeIcons: Record<Travel['mode'], ComponentType> = {
  walk: WalkIcon,
  train: TrainIcon,
  subway: TrainIcon,
  tram: TrainIcon,
  bus: BusIcon,
  ferry: FerryIcon,
  taxi: CarIcon,
  car: CarIcon,
  bike: BikeIcon,
  flight: FlightIcon,
  other: RouteIcon,
}
