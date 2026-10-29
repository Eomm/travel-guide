import { Link, Route, Routes } from 'react-router'

function Home() {
  return (
    <>
      <h1>Travel Guide</h1>
      <p>A personal travel guide. Trips will be listed here.</p>
    </>
  )
}

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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  )
}
