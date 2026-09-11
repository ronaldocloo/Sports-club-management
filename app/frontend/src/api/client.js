import axios from 'axios'

export const USE_MOCKS = false

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

export default apiClient
