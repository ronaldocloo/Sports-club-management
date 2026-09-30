import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppShell from "./components/layout/AppShell";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const MyProfilePage = lazy(() => import("./pages/MyProfilePage"));
const SportsPage = lazy(() => import("./pages/SportsPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
import LoginPage from "./pages/LoginPage";
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AthletesPage = lazy(() => import("./pages/AthletesPage"));
const AthleteDetailPage = lazy(() => import("./pages/AthleteDetailPage"));
const TeamsPage = lazy(() => import("./pages/TeamsPage"));
const TeamDetailPage = lazy(() => import("./pages/TeamDetailPage"));
const CompetitionsPage = lazy(() => import("./pages/CompetitionsPage"));
const CompetitionDetailPage = lazy(() => import("./pages/CompetitionDetailPage"));
const CoachesPage = lazy(() => import("./pages/CoachesPage"));
const CoachDetailPage = lazy(() => import("./pages/CoachDetailPage"));
const MembershipsPage = lazy(() => import("./pages/MembershipsPage"));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage"));
const FacilitiesPage = lazy(() => import("./pages/FacilitiesPage"));
const BookingsPage = lazy(() => import("./pages/BookingsPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const IntelligencePage = lazy(() => import("./pages/IntelligencePage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const OrganizationsPage = lazy(() => import("./pages/OrganizationsPage"));

import RequireAuth, { AuthSpinner } from "./components/auth/RequireAuth";

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AuthSpinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
