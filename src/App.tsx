import { Route, Routes } from 'react-router'
import Home from './pages/Home.tsx'
import NotFound from './pages/NotFound.tsx'
import TripLayout from './pages/TripLayout.tsx'
import Budget from './pages/trip/Budget.tsx'
import Itinerary from './pages/trip/Itinerary.tsx'
import Logistics from './pages/trip/Logistics.tsx'
import Places from './pages/trip/Places.tsx'

export default function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path=":slug" element={<TripLayout />}>
        <Route index element={<Itinerary />} />
        <Route path="day/:date" element={<Itinerary />} />
        <Route path="places" element={<Places />} />
        <Route path="logistics" element={<Logistics />} />
        <Route path="budget" element={<Budget />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
