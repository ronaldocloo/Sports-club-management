export const TODAY = new Date('2026-09-29')

// Status from expiry date and payment state. 'Pending' = signed up but not yet paid.
export function membershipStatus(m) {
  if (m.payment === 'Pending') return { key: 'Pending', label: 'Pending', tone: 'gray', days: null }
  const days = Math.ceil((new Date(m.expiry) - TODAY) / 86400000)
  if (days < 0) return { key: 'Expired', label: 'Expired', tone: 'red', days }
  if (days <= 30) return { key: 'Expiring', label: `Expires in ${days} days`, tone: 'amber', days }
  return { key: 'Active', label: 'Active', tone: 'green', days }
}
