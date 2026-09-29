import axios from 'axios'

// Mocks are enabled with VITE_DEMO_MODE=true in .env.local (see AuthContext).
export const USE_MOCKS = import.meta.env.VITE_DEMO_MODE === 'true'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

// The backend sends { status, message, error }. Return something safe to show in the UI.
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const status = err?.response?.status
  if (status === 403) return "You don't have permission to do that."
  if (status === 401) return 'Your session has expired. Please sign in again.'
  const message = err?.response?.data?.message
  if (message && typeof message === 'string' && message.length < 200) return message
  return fallback
}

const ORG_KEY = 'activeOrganizationId'

export function getActiveOrganizationId() {
  try { return localStorage.getItem(ORG_KEY) } catch { return null }
}

export function setActiveOrganizationId(id) {
  try { if (id) localStorage.setItem(ORG_KEY, String(id)); else localStorage.removeItem(ORG_KEY) } catch { /* storage unavailable */ }
}

// A Super Admin works inside one organization at a time; the server reads it from this header.
apiClient.interceptors.request.use((config) => {
  const id = getActiveOrganizationId()
  if (id) config.headers['X-Organization-Id'] = id
  return config
})

// A 401 on anything except the sign-in calls means the session ended (timeout, logout in another
// tab, or the account was deactivated). Tell the app so it can send the user back to sign in.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url || ''
    if (error?.response?.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/me')) {
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
    return Promise.reject(error)
  },
)

export default apiClient
