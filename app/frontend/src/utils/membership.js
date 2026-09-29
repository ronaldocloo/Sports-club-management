import { TODAY } from './today'

export { TODAY }

// Status from expiry date and payment state. 'Pending' = signed up but not yet paid.
// `status` (real API only): 'Suspended' or 'Expired' override the date-based result.
export function membershipStatus(m) {
  if (m.status === 'Suspended') return { key: 'Suspended', label: 'Suspended', tone: 'gray', days: null }
  if (m.payment === 'Pending' && !m.status) return { key: 'Pending', label: 'Pending', tone: 'gray', days: null }
  const days = Math.ceil((new Date(m.expiry) - TODAY) / 86400000)
  if (m.status === 'Expired' || days < 0) return { key: 'Expired', label: 'Expired', tone: 'red', days }
  if (days <= 30) return { key: 'Expiring', label: `Expires in ${days} days`, tone: 'amber', days }
  return { key: 'Active', label: 'Active', tone: 'green', days }
}
