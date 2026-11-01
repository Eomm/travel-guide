import { Route, Routes } from 'react-router'
import EditProvider from './edit/EditProvider.tsx'
import Home from './pages/Home.tsx'
import NotFound from './pages/NotFound.tsx'
import TripLayout from './pages/TripLayout.tsx'
import Budget from './pages/trip/Budget.tsx'
import Itinerary from './pages/trip/Itinerary.tsx'
import Logistics from './pages/trip/Logistics.tsx'
import PlaceDetail from './pages/trip/PlaceDetail.tsx'
import Places from './pages/trip/Places.tsx'

export default function App() {
  return (
    <EditProvider>
      <Routes>
        <Route index element={<Home />} />
        <Route path=":slug" element={<TripLayout />}>
          <Route index element={<Itinerary />} />
          <Route path="day/:date" element={<Itinerary />} />
          <Route path="places" element={<Places />} />
          <Route path="places/:placeId" element={<PlaceDetail />} />
          <Route path="logistics" element={<Logistics />} />
          <Route path="budget" element={<Budget />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </EditProvider>
  )
}
