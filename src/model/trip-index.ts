/** One entry of `data/index.json`: what the home page needs to list a trip. */
export interface TripSummary {
  slug: string
  title: string
  subtitle?: string
  startDate: string
  endDate: string
  /** Absolute URL or a path relative to `data/<slug>/`. */
  cover?: string
}
