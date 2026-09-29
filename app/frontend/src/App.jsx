import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppShell from "./components/layout/AppShell";

import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import MyProfilePage from "./pages/MyProfilePage";
import SportsPage from "./pages/SportsPage";
import UsersPage from "./pages/UsersPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
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
import IntelligencePage from "./pages/IntelligencePage";
import AttendancePage from "./pages/AttendancePage";
import OrganizationsPage from "./pages/OrganizationsPage";

import RequireAuth from "./components/auth/RequireAuth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/welcome" element={<LandingPage />} />

        <Route element={<AppShell />}>
          <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/me" element={<RequireAuth><MyProfilePage /></RequireAuth>} />

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
          <Route path="/attendance" element={<RequireAuth><AttendancePage /></RequireAuth>} />
          <Route path="/organizations" element={<RequireAuth><OrganizationsPage /></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
          <Route path="/intelligence" element={<RequireAuth><IntelligencePage /></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><ReportsPage /></RequireAuth>} />

          <Route path="/sports" element={<RequireAuth><SportsPage /></RequireAuth>} />
          <Route path="/users" element={<RequireAuth><UsersPage /></RequireAuth>} />
          <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
