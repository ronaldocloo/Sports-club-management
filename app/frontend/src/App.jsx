import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import RequireAuth from './components/auth/RequireAuth'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AthletesPage from './pages/AthletesPage'
import AthleteDetailPage from './pages/AthleteDetailPage'
import TeamsPage from './pages/TeamsPage'
import TeamDetailPage from './pages/TeamDetailPage'
import CompetitionsPage from './pages/CompetitionsPage'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/athletes"
          element={
            <RequireAuth>
              <AthletesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/athletes/:athleteId"
          element={
            <RequireAuth>
              <AthleteDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/teams"
          element={
            <RequireAuth>
              <TeamsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/teams/:teamId"
          element={
            <RequireAuth>
              <TeamDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/competitions"
          element={
            <RequireAuth>
              <CompetitionsPage />
            </RequireAuth>
          }
        />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
