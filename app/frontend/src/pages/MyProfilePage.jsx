import { UserX } from 'lucide-react'
import AthleteDetailPage from './AthleteDetailPage'
import { EmptyState } from '../components/ui'
import { useAuth } from '../context/AuthContext'

// The signed-in athlete's own profile. The account is linked to an athlete record by the backend
// (app_user.athlete_id); in demo mode it shows the first sample athlete.
function MyProfilePage() {
  const { user, demoMode } = useAuth()
  const athleteId = demoMode ? 1 : user?.athleteId

  if (!athleteId) {
    return (
      <EmptyState
        icon={UserX}
        title="Your account isn't linked to an athlete"
        description="Ask a club administrator to link your account to your athlete record."
      />
    )
  }
  return <AthleteDetailPage athleteId={athleteId} portal />
}

export default MyProfilePage
