import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function AuthSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  )
}

// Sends signed-out visitors to the login page and remembers where they were going.
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return children
}

export default RequireAuth
