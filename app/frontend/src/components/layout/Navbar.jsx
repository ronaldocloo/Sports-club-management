import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3">
      <div className="flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/athletes">Athletes</Link>
        <Link to="/teams">Teams</Link>
        <Link to="/competitions">Competitions</Link>
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-gray-600">
              {user.username} ({user.role})
            </span>
            <button onClick={handleLogout} className="text-sm underline">
              Log out
            </button>
          </>
        ) : (
          <Link to="/login">Log in</Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar
