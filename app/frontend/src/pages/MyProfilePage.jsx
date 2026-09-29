import AthleteDetailPage from './AthleteDetailPage'

// Athlete portal. Demo: shows athlete #1. With the real backend this should resolve the
// athlete linked to the signed-in user account.
function MyProfilePage() {
  return <AthleteDetailPage athleteId={1} portal />
}

export default MyProfilePage
