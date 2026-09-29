// Role-based access for the UI. The backend enforces the real rules (SecurityConfig);
// this only decides what to show. Backend roles: Admin, Coach, FrontDesk.
export const ROLE_LABELS = {
  SuperAdmin: 'Super Admin',
  Admin: 'Club Admin',
  Coach: 'Coach',
  FrontDesk: 'Front Desk',
  Athlete: 'Athlete',
}

const ALL = [
  '/', '/athletes', '/coaches', '/teams', '/competitions', '/sports', '/memberships', '/payments',
  '/facilities', '/bookings', '/events', '/attendance', '/analytics', '/reports', '/users', '/notifications', '/settings',
]

const ACCESS = {
  SuperAdmin: [...ALL, '/organizations'],
  Admin: ALL,
  Coach: ['/', '/athletes', '/teams', '/competitions', '/events', '/attendance', '/notifications', '/settings'],
  FrontDesk: ['/', '/athletes', '/memberships', '/payments', '/facilities', '/bookings', '/events', '/notifications', '/settings'],
  Athlete: ['/me', '/competitions', '/events', '/notifications', '/settings'],
}

export function normalizeRole(role) {
  if (!role) return 'Admin'
  const key = String(role).replace(/[\s_-]/g, '').toLowerCase()
  return Object.keys(ROLE_LABELS).find((r) => r.toLowerCase() === key) || 'Admin'
}

export function canAccess(role, pathname) {
  const allowed = ACCESS[normalizeRole(role)] || []
  const top = '/' + (pathname.split('/')[1] || '')
  return allowed.includes(top)
}

export const homeFor = (role) => {
  const r = normalizeRole(role)
  if (r === 'Athlete') return '/me'
  if (r === 'SuperAdmin') return '/organizations'
  return '/'
}
export const roleAccess = ACCESS
export const moduleList = ALL.filter((p) => p !== '/').map((p) => p.slice(1))
