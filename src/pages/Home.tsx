import { Link } from 'react-router'
import { loadTripIndex } from '../data/trips.ts'
import { useAsync } from '../data/useAsync.ts'

export default function Home() {
  const index = useAsync(loadTripIndex)
  return (
    <>
      <h1>Travel Guide</h1>
      {index.status === 'loading' && <p>Loading trips…</p>}
      {index.status === 'error' && <p role="alert">Cannot load the trips: {index.error.message}</p>}
      {index.status === 'success' && index.data.length === 0 && <p>No trips yet.</p>}
      {index.status === 'success' && index.data.length > 0 && (
        <ul className="trip-list">
          {index.data.map((trip) => (
            <li key={trip.slug}>
              <Link to={`/${trip.slug}`}>{trip.title}</Link>
              {trip.subtitle && <div>{trip.subtitle}</div>}
              <div className="muted">
                {trip.startDate} – {trip.endDate}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
