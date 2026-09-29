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

export default apiClient
