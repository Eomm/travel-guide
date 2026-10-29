import { Link, Route, Routes } from 'react-router'
import Home from './pages/Home.tsx'
import TripPage from './pages/TripPage.tsx'

function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p>
        <Link to="/">Back to home</Link>
      </p>
    </>
  )
}

export default function App() {
  return (
    <main className="container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:slug" element={<TripPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  )
}
