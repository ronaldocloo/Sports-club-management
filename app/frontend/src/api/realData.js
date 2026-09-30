// Turns the backend's normalised tables into the shapes the UI components expect.
// Everything here is pure: it takes the raw datasets from raw.loadAll() and joins them.
import { TODAY, TODAY_ISO } from '../utils/today'

const PALETTE = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b', '#ec4899']
const METHOD_LABEL = { Cash: 'Cash', Card: 'Card', BankTransfer: 'Bank transfer', MobileMoney: 'Mobile money' }
const PAY_STATUS_UI = { Completed: 'Paid', Pending: 'Pending', Failed: 'Failed', Refunded: 'Refunded' }
export const SLOT_KEYS = ['SLOT_06_08', 'SLOT_08_10', 'SLOT_10_12', 'SLOT_12_14', 'SLOT_14_16', 'SLOT_16_18', 'SLOT_18_20', 'SLOT_20_22']
export const slotLabel = (slot) => `${slot.slice(5, 7)}:00`
export const slotFromLabel = (label) => `SLOT_${label.slice(0, 2)}_${String(Number(label.slice(0, 2)) + 2).padStart(2, '0')}`

const byId = (list, key) => new Map(list.map((x) => [x[key], x]))
const fullName = (p) => (p ? `${p.firstName} ${p.lastName}` : 'Unknown')

function ageOf(dob) {
  if (!dob) return null
  const d = new Date(dob)
  let a = TODAY.getFullYear() - d.getFullYear()
  if (TODAY < new Date(TODAY.getFullYear(), d.getMonth(), d.getDate())) a--
  return a
}

export function index(raw) {
  const sports = byId(raw.sports, 'sportId')
  const teams = byId(raw.teams, 'teamId')
  const coaches = byId(raw.coaches, 'coachId')
  const athletes = byId(raw.athletes, 'athleteId')
  const types = byId(raw.membershipTypes, 'typeId')
  const memberships = byId(raw.memberships, 'membershipId')
  const competitions = byId(raw.competitions, 'competitionId')
  const facilities = byId(raw.facilities, 'facilityId')
  return { sports, teams, coaches, athletes, types, memberships, competitions, facilities }
}

function currentRoster(raw, athleteId) {
  const list = raw.rosters.filter((r) => r.athleteId === athleteId)
  return [...list].sort((a, b) => Number(b.isActive) - Number(a.isActive) || String(b.dateJoined).localeCompare(String(a.dateJoined)))[0] || null
}

export function membershipKey(m) {
  if (m.status === 'Suspended') return 'Suspended'
  if (m.status === 'Expired' || m.endDate < TODAY_ISO) return 'Expired'
  const days = Math.ceil((new Date(m.endDate) - TODAY) / 86400000)
  return days <= 30 ? 'Expiring' : 'Active'
}

function latestMembership(raw, athleteId) {
  return raw.memberships
    .filter((m) => m.athleteId === athleteId)
    .sort((a, b) => Number(b.status === 'Active') - Number(a.status === 'Active') || String(b.endDate).localeCompare(String(a.endDate)))[0] || null
}

function paymentState(raw, membershipId) {
  const list = raw.payments.filter((p) => p.membershipId === membershipId)
  if (list.some((p) => p.status === 'Completed')) return 'Paid'
  if (list.some((p) => p.status === 'Pending')) return 'Pending'
  return 'Overdue'
}

// ---------- athletes ----------
export function athletesOf(raw) {
  const ix = index(raw)
  return raw.athletes.map((a) => {
    const roster = currentRoster(raw, a.athleteId)
    const team = roster ? ix.teams.get(roster.teamId) : null
    const sport = team ? ix.sports.get(team.sportId) : null
    return { ...a, position: roster?.position || null, teamId: team?.teamId || null, teamName: team?.teamName || null, sport: sport?.sportName || null, rosterActive: roster ? roster.isActive : null }
  })
}

export function directoryOf(raw) {
  return athletesOf(raw).map((a) => {
    const m = latestMembership(raw, a.athleteId)
    return {
      athleteId: a.athleteId, name: fullName(a), firstName: a.firstName, lastName: a.lastName, dateOfBirth: a.dateOfBirth, gender: a.gender,
      email: a.email, phone: a.phone, sport: a.sport, position: a.position, teamId: a.teamId, team: a.teamName, age: ageOf(a.dateOfBirth),
      membership: m ? membershipKey(m) : null, attendance: null, status: a.rosterActive === false ? 'Inactive' : 'Active', hasRoster: a.rosterActive !== null,
    }
  })
}

export function profileOf(raw, athleteId) {
  const ix = index(raw)
  const a = athletesOf(raw).find((x) => x.athleteId === Number(athleteId))
  if (!a) return null
  const team = a.teamId ? ix.teams.get(a.teamId) : null
  const coach = team ? ix.coaches.get(team.coachId) : null
  const m = latestMembership(raw, a.athleteId)
  const type = m ? ix.types.get(m.typeId) : null
  const entries = raw.teamCompetitions.filter((tc) => tc.teamId === a.teamId)
  const history = entries.map((tc) => {
    const c = ix.competitions.get(tc.competitionId)
    const pos = tc.finalPosition
    return { competition: c?.compName || 'Competition', round: '', date: c?.compDate || tc.registrationDate, team: team?.teamName, opponent: '', score: '', label: pos ? `Finished #${pos}` : 'Registered', tone: pos === 1 ? 'green' : pos ? 'blue' : 'gray' }
  }).sort((x, y) => String(y.date).localeCompare(String(x.date)))
  return {
    ...a,
    status: a.rosterActive === false ? 'Inactive' : 'Active',
    teamName: a.teamName || 'Unassigned', coachName: coach ? fullName(coach) : 'Unassigned',
    membership: m ? { type: type?.typeName || 'Membership', start: m.startDate, expiry: m.endDate, payment: paymentState(raw, m.membershipId), status: m.status } : null,
    attendance: null, performance: null, history, sampleData: false,
  }
}

// ---------- teams, coaches, sports ----------
export function teamsOf(raw) {
  const ix = index(raw)
  return raw.teams.map((t) => {
    const coach = ix.coaches.get(t.coachId)
    const roster = raw.rosters.filter((r) => r.teamId === t.teamId).map((r) => {
      const a = ix.athletes.get(r.athleteId)
      return { athleteId: r.athleteId, firstName: a?.firstName || '', lastName: a?.lastName || '', position: r.position, isActive: r.isActive }
    })
    const competitions = raw.teamCompetitions.filter((tc) => tc.teamId === t.teamId).map((tc) => ({ competitionId: tc.competitionId, competitionName: ix.competitions.get(tc.competitionId)?.compName }))
    return { teamId: t.teamId, teamName: t.teamName, sport: ix.sports.get(t.sportId)?.sportName || null, sportId: t.sportId, coachId: t.coachId, coachName: coach ? fullName(coach) : 'Unassigned', roster, competitions, foundedDate: t.foundedDate }
  })
}

export function coachesOf(raw) {
  const teams = teamsOf(raw)
  const week = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] }
  return raw.coaches.map((c) => {
    const mine = teams.filter((t) => t.coachId === c.coachId)
    const athletes = new Set(mine.flatMap((t) => t.roster.map((r) => r.athleteId)))
    const years = c.hireDate ? Math.max(0, Math.floor((TODAY - new Date(c.hireDate)) / (365.25 * 86400000))) : 0
    return {
      coachId: c.coachId, firstName: c.firstName, lastName: c.lastName, sport: c.specialty || '—', specialization: c.specialty || '',
      experienceYears: years, status: 'Active', email: c.email, phone: c.phone, teams: mine.map((t) => t.teamName), athletes: athletes.size,
      certifications: [], schedule: week, today: [],
    }
  })
}

export function sportsOf(raw) {
  return raw.sports.map((s, i) => ({ id: s.sportId, name: s.sportName, description: s.description, color: PALETTE[i % PALETTE.length] }))
}

// ---------- competitions ----------
export function competitionsOf(raw) {
  const ix = index(raw)
  return raw.competitions.map((c) => {
    const entries = raw.teamCompetitions.filter((tc) => tc.competitionId === c.competitionId)
    const sport = entries.map((e) => ix.sports.get(ix.teams.get(e.teamId)?.sportId)?.sportName).find(Boolean)
    return { competitionId: c.competitionId, competitionName: c.compName, date: c.compDate, location: c.venue, status: c.compDate >= TODAY_ISO ? 'Upcoming' : 'Completed', sport: sport || null, level: c.level, registrationDeadline: c.registrationDeadline }
  })
}

export function competitionDetailOf(raw, id) {
  const ix = index(raw)
  const c = competitionsOf(raw).find((x) => x.competitionId === Number(id))
  if (!c) return null
  const entries = raw.teamCompetitions.filter((tc) => tc.competitionId === c.competitionId).map((tc) => ({
    teamId: tc.teamId, team: ix.teams.get(tc.teamId)?.teamName || 'Unknown team', finalPosition: tc.finalPosition, points: tc.pointsScored, registrationDate: tc.registrationDate,
  })).sort((a, b) => (a.finalPosition ?? 99) - (b.finalPosition ?? 99))
  return { ...c, organizer: null, description: null, teams: entries.map((e) => e.team), entries, fixtures: [], fixturesAvailable: false }
}

// ---------- memberships & payments ----------
export function plansOf(raw) {
  return raw.membershipTypes.map((t) => ({
    id: t.typeId, name: t.typeName, price: Number(t.fee), months: t.durationMonths, monthly: Number(t.fee) / (t.durationMonths || 1),
    period: t.durationMonths === 1 ? 'month' : `${t.durationMonths} months`, perks: t.description ? [t.description] : [],
  }))
}

export function membersOf(raw) {
  const ix = index(raw)
  const ath = athletesOf(raw)
  return raw.memberships.map((m) => {
    const a = ath.find((x) => x.athleteId === m.athleteId)
    const type = ix.types.get(m.typeId)
    return {
      id: m.membershipId, athleteId: m.athleteId, name: a ? fullName(a) : 'Unknown', sport: a?.sport || '—', type: type?.typeName || 'Membership',
      typeId: m.typeId, start: m.startDate, expiry: m.endDate, payment: paymentState(raw, m.membershipId), status: m.status,
    }
  })
}

export function paymentsOf(raw) {
  const ix = index(raw)
  return raw.payments.map((p) => {
    const m = ix.memberships.get(p.membershipId)
    const a = m ? ix.athletes.get(m.athleteId) : null
    return {
      id: p.paymentId, date: String(p.paymentDate).slice(0, 10), member: a ? fullName(a) : 'Unknown', type: 'Membership', amount: Number(p.amount),
      method: METHOD_LABEL[p.method] || p.method, status: PAY_STATUS_UI[p.status] || p.status, reference: p.referenceNo, membershipId: p.membershipId,
    }
  }).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
}

// ---------- facilities & bookings ----------
export function facilitiesOf(raw) {
  const confirmed = raw.bookings.filter((b) => b.status === 'Confirmed')
  const dates = confirmed.map((b) => b.bookingDate).sort()
  const span = dates.length ? Math.max(1, Math.round((new Date(dates.at(-1)) - new Date(dates[0])) / 86400000) + 1) : 1
  return raw.facilities.map((f) => {
    const n = confirmed.filter((b) => b.facilityId === f.facilityId).length
    return { id: f.facilityId, name: f.facilityName, type: f.facilityType, capacity: f.capacity, location: f.location, status: f.status, utilization: Math.min(100, Math.round((n / (span * SLOT_KEYS.length)) * 100)) }
  })
}

export function bookingsOf(raw) {
  const ix = index(raw)
  return raw.bookings.map((b) => ({
    id: b.bookingId, facilityId: b.facilityId, teamId: b.teamId, date: b.bookingDate, time: slotLabel(b.timeSlot), purpose: b.purpose || 'Booking',
    bookedBy: ix.teams.get(b.teamId)?.teamName || 'Unassigned', status: b.status,
  }))
}

// ---------- events (derived from competitions and bookings) ----------
export function eventsOf(raw) {
  const ix = index(raw)
  const teams = teamsOf(raw)
  const comps = raw.competitions.map((c) => {
    const entries = raw.teamCompetitions.filter((tc) => tc.competitionId === c.competitionId)
    const participants = entries.reduce((s, e) => s + (teams.find((t) => t.teamId === e.teamId)?.roster.length || 0), 0)
    return { id: `c${c.competitionId}`, title: c.compName, type: 'Competition', date: c.compDate, time: '—', location: c.venue || '—', organizer: c.level ? `${c.level} level` : '—', participants, status: c.compDate < TODAY_ISO ? 'Completed' : 'Scheduled' }
  })
  const books = raw.bookings.filter((b) => b.status === 'Confirmed').map((b) => {
    const team = teams.find((t) => t.teamId === b.teamId)
    const purpose = b.purpose || 'Booking'
    const type = /match|game/i.test(purpose) ? 'Match' : /train|practice|session/i.test(purpose) ? 'Training' : /meet/i.test(purpose) ? 'Team meeting' : 'Club event'
    return { id: `b${b.bookingId}`, title: `${purpose}${team ? ` – ${team.teamName}` : ''}`, type, date: b.bookingDate, time: slotLabel(b.timeSlot), location: ix.facilities.get(b.facilityId)?.facilityName || '—', organizer: team?.coachName || '—', participants: team?.roster.length || 0, status: b.bookingDate < TODAY_ISO ? 'Completed' : 'Scheduled' }
  })
  return [...comps, ...books]
}

// ---------- trends ----------
const monthLabel = (iso) => new Date(iso + '-01').toLocaleString('en-GB', { month: 'short', year: '2-digit' })

export function revenueByMonthOf(raw) {
  const sums = new Map()
  raw.payments.filter((p) => p.status === 'Completed').forEach((p) => {
    const k = String(p.paymentDate).slice(0, 7)
    sums.set(k, (sums.get(k) || 0) + Number(p.amount))
  })
  return [...sums.keys()].sort().slice(-6).map((k) => ({ month: monthLabel(k), memberships: sums.get(k), competitions: 0, facilities: 0, other: 0 }))
}

export function athleteGrowthOf(raw) {
  const counts = new Map()
  raw.athletes.forEach((a) => { const k = String(a.joinDate || '').slice(0, 7); if (k) counts.set(k, (counts.get(k) || 0) + 1) })
  let total = 0
  const rows = [...counts.keys()].sort().map((k) => { total += counts.get(k); return { key: k, month: monthLabel(k), athletes: total } })
  return rows.slice(-8)
}

// ---------- notifications & activity ----------
export function notificationsOf(raw) {
  const out = []
  let id = 1
  const members = membersOf(raw)
  members.filter((m) => membershipKey({ status: m.status, endDate: m.expiry }) === 'Expiring').slice(0, 4).forEach((m) => {
    const days = Math.ceil((new Date(m.expiry) - TODAY) / 86400000)
    out.push({ id: id++, kind: 'membership', text: `Membership expires in ${days} days for ${m.name}.`, time: 'Today', unread: true })
  })
  const expired = members.filter((m) => membershipKey({ status: m.status, endDate: m.expiry }) === 'Expired').length
  if (expired) out.push({ id: id++, kind: 'membership', text: `${expired} memberships have expired.`, time: 'Today', unread: false })
  const pending = raw.payments.filter((p) => p.status === 'Pending')
  if (pending.length) out.push({ id: id++, kind: 'payment', text: `${pending.length} payments are pending (GH₵${pending.reduce((s, p) => s + Number(p.amount), 0).toLocaleString('en-GH')}).`, time: 'Today', unread: true })
  competitionsOf(raw).filter((c) => c.status === 'Upcoming').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3).forEach((c) => {
    out.push({ id: id++, kind: 'competition', text: `${c.competitionName} is scheduled for ${c.date}.`, time: 'Upcoming', unread: false })
  })
  raw.facilities.filter((f) => f.status !== 'Available').forEach((f) => out.push({ id: id++, kind: 'facility', text: `${f.facilityName} is ${f.status.toLowerCase()}.`, time: 'Today', unread: false }))
  return out
}

export function activityOf(raw) {
  const ix = index(raw)
  const items = []
  paymentsOf(raw).filter((p) => p.status === 'Paid').slice(0, 6).forEach((p) => items.push({ id: `p${p.id}`, actor: 'Payment', action: 'received from', target: `${p.member} (GH₵${p.amount.toLocaleString('en-GH')})`, time: p.date }))
  raw.bookings.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 6).forEach((b) => items.push({ id: `b${b.bookingId}`, actor: 'Booking', action: 'created for', target: ix.facilities.get(b.facilityId)?.facilityName || 'facility', time: String(b.createdAt || b.bookingDate) }))
  return items.sort((a, b) => String(b.time).localeCompare(String(a.time))).slice(0, 6)
}
