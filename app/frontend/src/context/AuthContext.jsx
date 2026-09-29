import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '../api/auth'

const AuthContext = createContext(null)

// Set VITE_DEMO_MODE=true in .env.local to browse the UI without the backend running.
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const DEMO_USER = { username: 'admin', fullName: 'Ronald Ocloo', role: 'Admin' }
const ROLE_KEY = 'demoRole'

function readDemoRole() {
  try { return localStorage.getItem(ROLE_KEY) || 'Admin' } catch { return 'Admin' }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_MODE ? { ...DEMO_USER, role: readDemoRole() } : null)
  const [loading, setLoading] = useState(!DEMO_MODE)

  useEffect(() => {
    if (DEMO_MODE) return
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(username, password) {
    if (DEMO_MODE) {
      const demo = { ...DEMO_USER, role: readDemoRole() }
      setUser(demo)
      return demo
    }
    const loggedInUser = await loginRequest(username, password)
    setUser(loggedInUser)
    return loggedInUser
  }

  async function logout() {
    if (!DEMO_MODE) await logoutRequest()
    setUser(null)
  }

  // Demo mode only: preview the app as another role without logging in again.
  function switchDemoRole(role) {
    try { localStorage.setItem(ROLE_KEY, role) } catch { /* storage unavailable */ }
    setUser((u) => ({ ...u, role }))
  }

  const value = useMemo(() => ({ user, loading, login, logout, demoMode: DEMO_MODE, switchDemoRole }), [user, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
