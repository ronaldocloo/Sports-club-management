import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppShell from "./components/layout/AppShell";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import AthletesPage from "./pages/AthletesPage";
import AthleteDetailPage from "./pages/AthleteDetailPage";
import TeamsPage from "./pages/TeamsPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import CompetitionsPage from "./pages/CompetitionsPage";
import CompetitionDetailPage from "./pages/CompetitionDetailPage";
import CoachesPage from "./pages/CoachesPage";
import CoachDetailPage from "./pages/CoachDetailPage";
import MembershipsPage from "./pages/MembershipsPage";
import PaymentsPage from "./pages/PaymentsPage";
import FacilitiesPage from "./pages/FacilitiesPage";
import BookingsPage from "./pages/BookingsPage";
import EventsPage from "./pages/EventsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ReportsPage from "./pages/ReportsPage";
import PlaceholderPage from "./pages/PlaceholderPage";

import RequireAuth from "./components/auth/RequireAuth";

// Sections whose pages are not built yet render a placeholder so navigation never 404s.
const upcomingPaths = [
  "sports", "users", "notifications", "settings",
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/athletes" element={<RequireAuth><AthletesPage /></RequireAuth>} />
          <Route path="/athletes/:athleteId" element={<RequireAuth><AthleteDetailPage /></RequireAuth>} />
          <Route path="/coaches" element={<RequireAuth><CoachesPage /></RequireAuth>} />
          <Route path="/coaches/:coachId" element={<RequireAuth><CoachDetailPage /></RequireAuth>} />
          <Route path="/teams" element={<RequireAuth><TeamsPage /></RequireAuth>} />
          <Route path="/teams/:teamId" element={<RequireAuth><TeamDetailPage /></RequireAuth>} />
          <Route path="/competitions" element={<RequireAuth><CompetitionsPage /></RequireAuth>} />
          <Route path="/competitions/:competitionId" element={<RequireAuth><CompetitionDetailPage /></RequireAuth>} />

          <Route path="/memberships" element={<RequireAuth><MembershipsPage /></RequireAuth>} />
          <Route path="/payments" element={<RequireAuth><PaymentsPage /></RequireAuth>} />
          <Route path="/facilities" element={<RequireAuth><FacilitiesPage /></RequireAuth>} />
          <Route path="/bookings" element={<RequireAuth><BookingsPage /></RequireAuth>} />
          <Route path="/events" element={<RequireAuth><EventsPage /></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><ReportsPage /></RequireAuth>} />

          {upcomingPaths.map((path) => (
            <Route key={path} path={`/${path}`} element={<RequireAuth><PlaceholderPage /></RequireAuth>} />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
