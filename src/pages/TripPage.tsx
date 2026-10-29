import { Link, useParams } from 'react-router'
import { loadTrip, NotFoundError } from '../data/trips.ts'
import { useAsync } from '../data/useAsync.ts'
import type { Stop, Trip } from '../model/trip.gen.ts'

const BackHome = () => (
  <p>
    <Link to="/">← All trips</Link>
  </p>
)

/** `09:30 – Peace Memorial Museum`: the place name, or the title of a free stop. */
function stopLabel(stop: Stop, trip: Trip): string {
  const name = trip.places.find((place) => place.id === stop.placeId)?.name ?? stop.title ?? ''
  return stop.time ? `${stop.time} – ${name}` : name
}

function TripView({ trip }: { trip: Trip }) {
  return (
    <>
      <h1>{trip.trip.title}</h1>
      <p className="muted">
        {trip.trip.startDate} – {trip.trip.endDate}
      </p>
      {trip.days.map((day) => (
        <section key={day.date}>
          <h2>
            {day.date}
            {day.title && ` · ${day.title}`}
          </h2>
          <ul>
            {day.stops.map((stop, s) => (
              <li key={stop.id ?? s}>{stopLabel(stop, trip)}</li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

export default function TripPage() {
  const { slug = '' } = useParams()
  const trip = useAsync(loadTrip, slug)
  return (
    <>
      <BackHome />
      {trip.status === 'loading' && <p>Loading trip…</p>}
      {trip.status === 'error' && trip.error instanceof NotFoundError && <h1>Trip not found</h1>}
      {trip.status === 'error' && !(trip.error instanceof NotFoundError) && (
        <p role="alert">Cannot load the trip: {trip.error.message}</p>
      )}
      {trip.status === 'success' && <TripView trip={trip.data} />}
    </>
  )
}
