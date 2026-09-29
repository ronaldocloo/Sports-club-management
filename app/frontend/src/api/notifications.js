import apiClient, { USE_MOCKS } from './client'
import { notifications as demoNotifications } from '../mocks/demoData'

function ago(iso) {
  if (!iso) return ''
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

export async function getNotifications() {
  if (USE_MOCKS) return demoNotifications
  const { data } = await apiClient.get('/notifications')
  return data.map((n) => ({ id: n.notificationId, kind: n.kind, text: n.message, link: n.link, time: ago(n.createdAt), unread: !n.isRead }))
}

export async function markNotificationRead(id) {
  if (!USE_MOCKS) await apiClient.post(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
  if (!USE_MOCKS) await apiClient.post('/notifications/read-all')
}

export async function deleteNotification(id) {
  if (!USE_MOCKS) await apiClient.delete(`/notifications/${id}`)
}

// Runs the daily rules now (expire memberships, warn about expiries) for the caller's organization.
export async function runDailyJobs() {
  const { data } = await apiClient.post('/admin/jobs/run')
  return data
}
