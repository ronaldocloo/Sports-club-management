import apiClient, { USE_MOCKS } from './client'

// code is only needed when the account has two-step sign-in on; the server answers 401 with error "MFA_REQUIRED" until it is sent.
export async function login(username, password, code) {
  const response = await apiClient.post('/auth/login', { username, password, ...(code ? { code } : {}) })
  return response.data
}

export async function logout() {
  await apiClient.post('/auth/logout')
}

export async function getCurrentUser() {
  const response = await apiClient.get('/auth/me')
  return response.data
}

export async function changePassword(currentPassword, newPassword) {
  await apiClient.post('/auth/change-password', { currentPassword, newPassword })
}

// What this server can do (for example, whether it can send password-reset email), so the page only offers what works.
export async function getCapabilities() {
  if (USE_MOCKS) return { passwordResetByEmail: false }
  try {
    return (await apiClient.get('/auth/capabilities')).data
  } catch {
    return { passwordResetByEmail: false }
  }
}

export async function forgotPassword(email) {
  return (await apiClient.post('/auth/forgot-password', { email })).data
}

export async function resetPassword(token, newPassword) {
  return (await apiClient.post('/auth/reset-password', { token, newPassword })).data
}

export async function setOwnEmail(email) {
  return (await apiClient.put('/auth/email', { email })).data
}

export async function startTwoStep() {
  return (await apiClient.post('/auth/mfa/setup')).data
}

export async function confirmTwoStep(code) {
  return (await apiClient.post('/auth/mfa/enable', { code })).data.recoveryCodes
}

export async function stopTwoStep(password, code) {
  await apiClient.post('/auth/mfa/disable', { password, code })
}
