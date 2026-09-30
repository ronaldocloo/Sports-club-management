import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '../api/auth'

const AuthContext = createContext(null)

// Set VITE_DEMO_MODE=true in .env.local to browse the UI without the backend running.
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const DEMO_USER = { username: 'admin', fullName: 'Ronald Ocloo', role: 'Admin', athleteId: 1 }
const ROLE_KEY = 'demoRole'
const LOGOUT_KEY = 'auth:logout'

function readDemoRole() {
  try { return localStorage.getItem(ROLE_KEY) || 'Admin' } catch { return 'Admin' }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_MODE ? { ...DEMO_USER, role: readDemoRole() } : null)
  const [loading, setLoading] = useState(!DEMO_MODE)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    if (DEMO_MODE) return
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // The API says our session is gone (timeout, deactivated account, role changed).
  useEffect(() => {
    if (DEMO_MODE) return undefined
    const onExpired = () => { setUser((u) => { if (u) setSessionExpired(true); return null }) }
    // Signing out in one tab signs out every open tab.
    const onStorage = (e) => { if (e.key === LOGOUT_KEY) setUser(null) }
    window.addEventListener('auth:expired', onExpired)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('auth:expired', onExpired)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const login = useCallback(async (username, password, code) => {
    if (DEMO_MODE) {
      const demo = { ...DEMO_USER, role: readDemoRole() }
      setUser(demo)
      return demo
    }
    const loggedInUser = await loginRequest(username, password, code)
    setSessionExpired(false)
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  // Re-reads the signed-in user, for example after turning two-step sign-in on or changing the email address.
  const refreshUser = useCallback(async () => {
    if (DEMO_MODE) return
    setUser(await getCurrentUser())
  }, [])

  const logout = useCallback(async () => {
    try {
      if (!DEMO_MODE) await logoutRequest()
    } finally {
      setUser(null)
      setSessionExpired(false)
      try { localStorage.setItem(LOGOUT_KEY, String(Date.now())) } catch { /* storage unavailable */ }
    }
  }, [])

  // Demo mode only: preview the app as another role without logging in again.
  const switchDemoRole = useCallback((role) => {
    try { localStorage.setItem(ROLE_KEY, role) } catch { /* storage unavailable */ }
    setUser((u) => ({ ...u, role }))
  }, [])

  const value = useMemo(
    () => ({ user, loading, sessionExpired, login, logout, refreshUser, demoMode: DEMO_MODE, switchDemoRole }),
    [user, loading, sessionExpired, login, logout, refreshUser, switchDemoRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
