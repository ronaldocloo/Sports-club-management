import apiClient, { USE_MOCKS } from './client'
import { invalidate, loadAll, raw } from './raw'
import { activityOf, bookingsOf, eventsOf, facilitiesOf, membersOf, notificationsOf, paymentsOf, plansOf, revenueByMonthOf, slotFromLabel, slotLabel, SLOT_KEYS } from './realData'
import { initialBookings, initialEvents, initialFacilities, initialPayments, initialPlans, timeSlots } from '../mocks/operationsData'
import { initialUsers } from '../mocks/usersData'
import { auditLog } from '../mocks/auditData'
import { notifications as demoNotifications, revenueByMonth as demoRevenue } from '../mocks/demoData'
import { mockAthletes } from '../mocks/mockData'
import { membershipFor } from '../mocks/athleteData'
import { TODAY_ISO } from '../utils/today'

// Demo mode returns the sample data below after a short delay (so loading states show).
// Real mode reads and writes the Spring Boot API through the adapters in realData.js.
const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = (v) => JSON.parse(JSON.stringify(v))

const METHOD_TO_API = { Cash: 'Cash', Card: 'Card', 'Bank transfer': 'BankTransfer', 'Mobile money': 'MobileMoney', 'MTN MoMo': 'MobileMoney', 'Vodafone Cash': 'MobileMoney' }
const PAY_STATUS_TO_API = { Paid: 'Completed', Pending: 'Pending', Failed: 'Failed', Refunded: 'Refunded' }

// ---------- memberships ----------
export async function getMembershipPlans() {
  if (USE_MOCKS) { await delay(); return clone(initialPlans) }
  return plansOf(await loadAll())
}

export async function getMembers() {
  if (USE_MOCKS) {
    await delay()
    return mockAthletes.map((a) => ({ id: a.athleteId, athleteId: a.athleteId, name: `${a.firstName} ${a.lastName}`, sport: a.sport, ...membershipFor(a.athleteId) }))
  }
  return membersOf(await loadAll())
}

export async function createMembershipPlan(plan) {
  if (USE_MOCKS) return { ...plan, id: Date.now() }
  const months = Number(plan.months) || 1
  const { data } = await apiClient.post('/membership-types', { typeName: plan.name, fee: plan.price, durationMonths: months, description: plan.perks.join('; ') || null })
  invalidate()
  return { id: data.typeId, name: data.typeName, price: Number(data.fee), months, monthly: Number(data.fee) / months, period: months === 1 ? 'month' : `${months} months`, perks: plan.perks }
}

// values: { athleteId, typeId (real) or type name (demo), startDate }. Real memberships run for the plan's duration.
export async function createMembership(values, plan, athlete) {
  const start = values.startDate || TODAY_ISO
  const end = new Date(start)
  end.setMonth(end.getMonth() + (plan.months || 12))
  const endDate = end.toISOString().slice(0, 10)
  if (USE_MOCKS) return { id: Date.now(), athleteId: athlete.athleteId, name: `${athlete.firstName} ${athlete.lastName}`, sport: athlete.sport, type: plan.name, start, expiry: endDate, payment: 'Pending' }
  const { data: m } = await apiClient.post('/memberships', { athleteId: Number(values.athleteId), typeId: plan.id, startDate: start, endDate, amountCharged: plan.price, status: 'Active' })
  invalidate()
  return { id: m.membershipId, athleteId: m.athleteId, name: `${athlete.firstName} ${athlete.lastName}`, sport: athlete.sport || '—', type: plan.name, typeId: plan.id, start: m.startDate, expiry: m.endDate, payment: 'Overdue', status: m.status }
}

// ---------- payments ----------
export async function getPayments() {
  if (USE_MOCKS) { await delay(); return clone(initialPayments) }
  return paymentsOf(await loadAll())
}

export async function getRevenueByMonth() {
  if (USE_MOCKS) return demoRevenue
  return revenueByMonthOf(await loadAll())
}

// values: { memberId, member, type, amount, method, status }. Real payments belong to a membership.
export async function recordPayment(values) {
  if (USE_MOCKS) {
    await delay(300)
    return { id: Math.max(0, ...initialPayments.map((p) => p.id)) + Math.floor(Math.random() * 1000) + 1, date: TODAY_ISO, member: values.member, type: values.type, amount: values.amount, method: values.method, status: values.status }
  }
  const { data: p } = await apiClient.post('/payments', {
    membershipId: Number(values.memberId), amount: values.amount, paymentDate: new Date().toISOString().slice(0, 19),
    method: METHOD_TO_API[values.method] || 'Cash', status: PAY_STATUS_TO_API[values.status] || 'Completed', referenceNo: `WEB-${Date.now()}`,
  })
  invalidate()
  return { id: p.paymentId, date: String(p.paymentDate).slice(0, 10), member: values.member, type: 'Membership', amount: Number(p.amount), method: values.method, status: values.status, membershipId: p.membershipId }
}

// Admin-only on the server (front desk cannot change a payment after it is created).
export async function markPaymentPaid(payment) {
  if (USE_MOCKS) return { ...payment, status: 'Paid' }
  const original = (await raw.payments()).find((p) => p.paymentId === payment.id)
  await apiClient.put(`/payments/${payment.id}`, { membershipId: original.membershipId, amount: original.amount, paymentDate: original.paymentDate, method: original.method, status: 'Completed', referenceNo: original.referenceNo })
  invalidate()
  return { ...payment, status: 'Paid' }
}

// ---------- facilities ----------
const FACILITY_TYPES_REAL = ['Court', 'Field', 'Pool', 'Gym', 'Track', 'Hall']
const FACILITY_TYPES_DEMO = ['Football pitch', 'Basketball court', 'Swimming pool', 'Gym', 'Tennis court', 'Meeting room', 'Training facility']
export const facilityTypes = USE_MOCKS ? FACILITY_TYPES_DEMO : FACILITY_TYPES_REAL

export async function getFacilities() {
  if (USE_MOCKS) { await delay(); return clone(initialFacilities) }
  return facilitiesOf(await loadAll())
}

export async function createFacility(f) {
  if (USE_MOCKS) return { id: Date.now(), status: 'Available', utilization: 0, ...f }
  const { data } = await apiClient.post('/facilities', { facilityName: f.name, facilityType: f.type, capacity: f.capacity, location: f.location || null, status: 'Available' })
  invalidate()
  return { id: data.facilityId, name: data.facilityName, type: data.facilityType, capacity: data.capacity, location: data.location, status: data.status, utilization: 0 }
}

export async function setFacilityStatus(facility, status) {
  if (USE_MOCKS) return { ...facility, status }
  await apiClient.put(`/facilities/${facility.id}`, { facilityName: facility.name, facilityType: facility.type, capacity: facility.capacity, location: facility.location || null, status })
  invalidate()
  return { ...facility, status }
}

// ---------- bookings ----------
export const bookingConfig = {
  slots: USE_MOCKS ? timeSlots : SLOT_KEYS.map(slotLabel),
  approvalFlow: USE_MOCKS, // demo has Pending -> Confirmed; the server only has Confirmed/Cancelled
}

export async function getBookings() {
  if (USE_MOCKS) { await delay(); return clone(initialBookings) }
  return bookingsOf(await loadAll()).filter((b) => b.status === 'Confirmed')
}

export async function createBooking({ facilityId, date, time, purpose, teamId, bookedBy }) {
  if (USE_MOCKS) return { id: Date.now(), facilityId, date, time, purpose, bookedBy, status: 'Pending' }
  const { data: b } = await apiClient.post('/facility-bookings', { facilityId, teamId: Number(teamId), bookingDate: date, timeSlot: slotFromLabel(time), purpose, status: 'Confirmed' })
  invalidate()
  const team = (await raw.teams()).find((t) => t.teamId === b.teamId)
  return { id: b.bookingId, facilityId: b.facilityId, teamId: b.teamId, date: b.bookingDate, time, purpose: b.purpose, bookedBy: team?.teamName || 'Team', status: 'Confirmed' }
}

export async function approveBooking(booking) {
  if (USE_MOCKS) return { ...booking, status: 'Confirmed' }
  return booking // nothing to approve on the server
}

export async function cancelBooking(booking) {
  if (USE_MOCKS) return booking
  const original = (await raw.bookings()).find((b) => b.bookingId === booking.id)
  await apiClient.put(`/facility-bookings/${booking.id}`, { facilityId: original.facilityId, teamId: original.teamId, bookingDate: original.bookingDate, timeSlot: original.timeSlot, purpose: original.purpose, status: 'Cancelled' })
  invalidate()
  return booking
}

// ---------- events ----------
export async function getEvents() {
  if (USE_MOCKS) { await delay(); return clone(initialEvents) }
  return eventsOf(await loadAll())
}

export const eventsAreDerived = !USE_MOCKS // real events come from competitions and bookings

// ---------- users ----------
export async function getUsers() {
  if (USE_MOCKS) { await delay(); return initialUsers.map((u) => ({ ...u })) }
  const list = await raw.users()
  return list.map((u) => ({ id: u.userId, name: u.username, username: u.username, email: '', role: u.role, active: u.isActive, lastLogin: u.lastLogin, coachId: u.coachId }))
}

export async function createUser(v) {
  if (USE_MOCKS) return { id: Date.now(), ...v, active: true, lastLogin: null }
  const { data } = await apiClient.post('/users', { username: v.username, password: v.password, role: v.role, coachId: v.coachId ? Number(v.coachId) : null, isActive: true })
  invalidate()
  return { id: data.userId, name: data.username, username: data.username, email: '', role: data.role, active: data.isActive, lastLogin: data.lastLogin, coachId: data.coachId }
}

// ---------- audit log, notifications, activity ----------
// The backend has no audit table yet, so real mode has no audit entries.
export async function getAuditLog() {
  if (USE_MOCKS) return auditLog
  return []
}

export async function getNotifications() {
  if (USE_MOCKS) return demoNotifications
  return notificationsOf(await loadAll())
}

export async function getRecentActivity() {
  if (USE_MOCKS) return auditLog.slice(0, 6)
  return activityOf(await loadAll())
}
