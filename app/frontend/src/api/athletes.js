import apiClient, { USE_MOCKS } from './client'
import { invalidate, loadAll } from './raw'
import { athleteGrowthOf, athletesOf, directoryOf, profileOf } from './realData'
import { mockAthletes, mockTeams } from '../mocks/mockData'
import { buildAthleteProfile } from '../mocks/athleteData'
import { athleteGrowth } from '../mocks/demoData'
import { getAthleteAttendance, getAttendanceRates } from './attendance'
import { getPerformanceSummary } from './performance'
import { membershipStatus } from '../utils/membership'
import { TODAY, TODAY_ISO } from '../utils/today'

// Demo mode only: athletes added this session, so they survive navigation (not a page reload).
const sessionAthletes = []

function ageOf(dob) {
  if (!dob) return null
  const d = new Date(dob)
  let a = TODAY.getFullYear() - d.getFullYear()
  if (TODAY < new Date(TODAY.getFullYear(), d.getMonth(), d.getDate())) a--
  return a
}

const allMock = () => [...sessionAthletes, ...mockAthletes]

export async function getAthletes() {
  if (USE_MOCKS) return allMock()
  return athletesOf(await loadAll())
}

export async function getAthleteById(athleteId) {
  if (USE_MOCKS) return allMock().find((a) => a.athleteId === Number(athleteId))
  return (await getAthletes()).find((a) => a.athleteId === Number(athleteId))
}

// Rows for the athlete directory. In the real API attendance is null (not tracked yet).
export async function getAthleteDirectory() {
  if (!USE_MOCKS) {
    const [raw, rates] = await Promise.all([loadAll(), getAttendanceRates()])
    return directoryOf(raw).map((row) => {
      const r = rates[row.athleteId]
      return r ? { ...row, attendance: r.rate, attendanceRecent: r.recentRate, attendanceEarlier: r.earlierRate } : row
    })
  }
  return allMock().map((a) => {
    const p = buildAthleteProfile(a)
    return {
      athleteId: a.athleteId, name: `${a.firstName} ${a.lastName}`, firstName: a.firstName, lastName: a.lastName, dateOfBirth: a.dateOfBirth,
      gender: a.gender, email: a.email, phone: a.phone, sport: a.sport || null, position: a.position || null, teamId: a.teamId || null,
      team: p.teamName, age: ageOf(a.dateOfBirth), membership: membershipStatus(p.membership).key, attendance: p.attendance.rate, status: 'Active', hasRoster: true,
    }
  })
}

// Athlete plus attendance/performance/membership. Attendance and performance are sample data
// in demo mode and null with the real API.
export async function getAthleteProfile(athleteId) {
  if (USE_MOCKS) {
    const athlete = await getAthleteById(athleteId)
    if (!athlete) return null
    const p = buildAthleteProfile(athlete)
    p.history = p.history.map((h) => ({ ...h, label: `${h.result} ${h.score}`, tone: { Win: 'green', Draw: 'amber', Loss: 'red' }[h.result] }))
    return p
  }
  const profile = profileOf(await loadAll(), athleteId)
  if (!profile) return null
  const [attendance, performance] = await Promise.all([getAthleteAttendance(athleteId), getPerformanceSummary(athleteId)])
  return { ...profile, attendance, performance }
}

export async function getAthleteGrowth() {
  if (USE_MOCKS) return athleteGrowth
  return athleteGrowthOf(await loadAll())
}

const personalFields = (data, joinDate) => ({
  firstName: data.firstName, lastName: data.lastName, dateOfBirth: data.dateOfBirth, gender: data.gender,
  email: data.email || null, phone: data.phone, joinDate: joinDate || TODAY_ISO,
})

// Adds an athlete. With the real API this POSTs /athletes and, if a team was chosen, /team-rosters.
// If only the roster step fails, the athlete still exists; `rosterError` explains why.
export async function createAthlete(data) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 500))
    const athlete = { athleteId: Date.now(), ...data }
    sessionAthletes.unshift(athlete)
    return { ...athlete, name: `${data.firstName} ${data.lastName}`, age: ageOf(data.dateOfBirth), status: 'Active', membership: 'Pending', attendance: null }
  }
  const { data: a } = await apiClient.post('/athletes', personalFields(data))
  invalidate()
  const row = { ...data, athleteId: a.athleteId, name: `${a.firstName} ${a.lastName}`, age: ageOf(a.dateOfBirth), status: 'Active', membership: null, attendance: null, hasRoster: false }
  if (data.teamId) {
    try {
      await apiClient.post('/team-rosters', { teamId: data.teamId, athleteId: a.athleteId, dateJoined: TODAY_ISO, position: data.position || null, isActive: true })
      row.hasRoster = true
    } catch (e) {
      row.rosterError = e
      row.team = null
      row.teamId = null
    }
  }
  return row
}

export async function updateAthlete(athlete, data) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300))
    const session = sessionAthletes.find((a) => a.athleteId === athlete.athleteId)
    if (session) Object.assign(session, data)
    return { ...athlete, ...data, name: `${data.firstName} ${data.lastName}`, age: ageOf(data.dateOfBirth) }
  }
  const { data: a } = await apiClient.put(`/athletes/${athlete.athleteId}`, personalFields(data))
  invalidate()
  return { ...athlete, ...data, name: `${a.firstName} ${a.lastName}`, age: ageOf(a.dateOfBirth) }
}

// Puts an athlete on a team. Real API: creates the roster row, or reactivates an existing one.
export async function assignTeam(athlete, team) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300))
    return { ...athlete, team: team.teamName, teamId: team.teamId, sport: athlete.sport || team.sport, hasRoster: true }
  }
  const raw = await loadAll()
  const existing = raw.rosters.find((r) => r.teamId === team.teamId && r.athleteId === athlete.athleteId)
  const body = { teamId: team.teamId, athleteId: athlete.athleteId, dateJoined: existing?.dateJoined || TODAY_ISO, position: athlete.position || existing?.position || null, isActive: true }
  if (existing) await apiClient.put(`/team-rosters/${team.teamId}/${athlete.athleteId}`, body)
  else await apiClient.post('/team-rosters', body)
  invalidate()
  return { ...athlete, team: team.teamName, teamId: team.teamId, sport: athlete.sport || team.sport, hasRoster: true, status: 'Active' }
}

// "Deactivate" marks the athlete's roster entries inactive; the athlete record is kept.
export async function setAthleteActive(athlete, active) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300))
    return { ...athlete, status: active ? 'Active' : 'Inactive' }
  }
  const raw = await loadAll()
  const rosters = raw.rosters.filter((r) => r.athleteId === athlete.athleteId)
  await Promise.all(rosters.map((r) => apiClient.put(`/team-rosters/${r.teamId}/${r.athleteId}`, { teamId: r.teamId, athleteId: r.athleteId, dateJoined: r.dateJoined, position: r.position, isActive: active })))
  invalidate()
  return { ...athlete, status: active ? 'Active' : 'Inactive' }
}

export { mockTeams }
