import axios from 'axios'

// Mocks are enabled with VITE_DEMO_MODE=true in .env.local (see AuthContext).
export const USE_MOCKS = import.meta.env.VITE_DEMO_MODE === 'true'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

export default apiClient
