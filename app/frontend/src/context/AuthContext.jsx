import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '../api/auth'

const AuthContext = createContext(null)

// Set VITE_DEMO_MODE=true in .env.local to browse the UI without the backend running.
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const DEMO_USER = { username: 'admin', fullName: 'Ronald Ocloo', role: 'Club Admin' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_MODE ? DEMO_USER : null)
  const [loading, setLoading] = useState(!DEMO_MODE)

  useEffect(() => {
    if (DEMO_MODE) return
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(username, password) {
    const loggedInUser = await loginRequest(username, password)
    setUser(loggedInUser)
    return loggedInUser
  }

  async function logout() {
    await logoutRequest()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
