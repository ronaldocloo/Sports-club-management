import apiClient from './client'

// Short-lived cache so a page (or the dashboard) that needs several joined datasets does not
// refetch the same endpoint repeatedly. Writes call invalidate().
const TTL_MS = 8000
const cache = new Map()

function load(path, optional = false) {
  const hit = cache.get(path)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise
  const promise = apiClient
    .get(path)
    .then((r) => r.data)
    .catch((err) => {
      cache.delete(path)
      // Endpoints a role may not read (403) just come back empty for auxiliary data.
      if (optional && [403, 404].includes(err?.response?.status)) return []
      throw err
    })
  cache.set(path, { at: Date.now(), promise })
  return promise
}

export const raw = {
  athletes: () => load('/athletes'),
  teams: () => load('/teams', true),
  sports: () => load('/sports', true),
  coaches: () => load('/coaches', true),
  competitions: () => load('/competitions'),
  teamCompetitions: () => load('/team-competitions', true),
  rosters: () => load('/team-rosters', true),
  facilities: () => load('/facilities'),
  bookings: () => load('/facility-bookings'),
  memberships: () => load('/memberships', true),
  membershipTypes: () => load('/membership-types', true),
  payments: () => load('/payments', true),
  users: () => load('/users'),
}

export const invalidate = () => cache.clear()

export async function loadAll() {
  const keys = ['athletes', 'teams', 'sports', 'coaches', 'competitions', 'teamCompetitions', 'rosters', 'facilities', 'bookings', 'memberships', 'membershipTypes', 'payments']
  const values = await Promise.all(keys.map((k) => raw[k]()))
  return Object.fromEntries(keys.map((k, i) => [k, values[i]]))
}
