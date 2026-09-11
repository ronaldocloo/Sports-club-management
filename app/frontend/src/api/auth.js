import apiClient from './client'

export async function login(username, password) {
  const response = await apiClient.post('/auth/login', { username, password })
  return response.data
}

export async function logout() {
  await apiClient.post('/auth/logout')
}

export async function getCurrentUser() {
  const response = await apiClient.get('/auth/me')
  return response.data
}
