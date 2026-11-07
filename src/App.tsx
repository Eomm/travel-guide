import { Navigate, Route, Routes } from 'react-router'
import Home from './pages/Home.tsx'
import NotFound from './pages/NotFound.tsx'
import Days from './pages/planner/Days.tsx'
import PlannerLogistics from './pages/planner/Logistics.tsx'
import PlannerLayout from './pages/planner/PlannerLayout.tsx'
import PlannerStart from './pages/planner/PlannerStart.tsx'
import PlannerPlaces from './pages/planner/Places.tsx'
import Settings from './pages/planner/Settings.tsx'
import TripLayout from './pages/TripLayout.tsx'
import Budget from './pages/trip/Budget.tsx'
import Itinerary from './pages/trip/Itinerary.tsx'
import Logistics from './pages/trip/Logistics.tsx'
import PlaceDetail from './pages/trip/PlaceDetail.tsx'
import Places from './pages/trip/Places.tsx'

export default function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      {/* a static segment wins over `:slug`: no trip can be named `plan` (scripts/load-trips.ts) */}
      <Route path="plan" element={<PlannerStart />} />
      <Route path="plan/:slug" element={<PlannerLayout />}>
        <Route index element={<Navigate to="settings" replace />} />
        <Route path="settings" element={<Settings />} />
        <Route path="days" element={<Days />} />
        <Route path="places" element={<PlannerPlaces />} />
        <Route path="logistics" element={<PlannerLogistics />} />
        <Route path="*" element={<NotFound />} />
      </Route>
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
  )
}
