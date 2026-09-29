import { initialBookings, initialEvents, initialFacilities, initialPayments, initialPlans } from '../mocks/operationsData'
import { mockAthletes } from '../mocks/mockData'
import { membershipFor } from '../mocks/athleteData'

// Mock-first: replace these with apiClient calls (/memberships, /payments, /facilities,
// /facility-bookings) once the backend responses are wired up. Each function resolves after a
// short delay so the UI's loading states are exercised.
const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = (v) => JSON.parse(JSON.stringify(v))

export async function getMembershipPlans() { await delay(); return clone(initialPlans) }

export async function getMembers() {
  await delay()
  return mockAthletes.map((a) => ({
    athleteId: a.athleteId,
    name: `${a.firstName} ${a.lastName}`,
    sport: a.sport,
    ...membershipFor(a.athleteId),
  }))
}

export async function getPayments() { await delay(); return clone(initialPayments) }
export async function getFacilities() { await delay(); return clone(initialFacilities) }
export async function getBookings() { await delay(); return clone(initialBookings) }
export async function getEvents() { await delay(); return clone(initialEvents) }
