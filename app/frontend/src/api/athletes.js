import apiClient, { USE_MOCKS } from './client'
import { mockAthletes } from '../mocks/mockData'
import { buildAthleteProfile } from '../mocks/athleteData'
import { membershipStatus } from '../utils/membership'

// Demo mode only: athletes added this session, so they survive navigation (not a page reload).
const sessionAthletes = []

export async function getAthletes() {
  if (USE_MOCKS) {
    return [...sessionAthletes, ...mockAthletes]
  }
  const response = await apiClient.get('/athletes')
  return response.data
}

export async function getAthleteById(athleteId) {
  if (USE_MOCKS) {
    return [...sessionAthletes, ...mockAthletes].find((athlete) => athlete.athleteId === Number(athleteId))
  }
  const response = await apiClient.get(`/athletes/${athleteId}`)
  return response.data
}

// Athlete plus attendance/performance/membership. Extras are sample data until the backend provides them.
export async function getAthleteProfile(athleteId) {
  const athlete = await getAthleteById(athleteId)
  if (!athlete) return null
  return buildAthleteProfile(athlete)
}

function ageOf(dob) {
  if (!dob) return null
  const d = new Date(dob)
  const now = new Date('2026-09-29')
  let a = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--
  return a
}

// Rows for the athlete directory. Team, membership and attendance come from sample data in
// demo mode; with the real API they are null until the backend exposes them.
export async function getAthleteDirectory() {
  const list = await getAthletes()
  return list.map((a) => {
    const base = { athleteId: a.athleteId, name: `${a.firstName} ${a.lastName}`, sport: a.sport || null, position: a.position || null, age: ageOf(a.dateOfBirth), status: 'Active', teamId: a.teamId || null, email: a.email, firstName: a.firstName, lastName: a.lastName, dateOfBirth: a.dateOfBirth, gender: a.gender, phone: a.phone }
    if (!USE_MOCKS) return { ...base, team: null, membership: null, attendance: null }
    const p = buildAthleteProfile(a)
    return { ...base, team: p.teamName, membership: membershipStatus(p.membership).key, attendance: p.attendance.rate }
  })
}

// Demo mode keeps new athletes in memory only. With the real API this POSTs to /athletes.
export async function createAthlete(data) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 500))
    const athlete = { athleteId: Date.now(), ...data }
    sessionAthletes.unshift(athlete)
    return { ...athlete, name: `${data.firstName} ${data.lastName}`, age: ageOf(data.dateOfBirth), status: 'Active', membership: 'Pending', attendance: null }
  }
  const response = await apiClient.post('/athletes', {
    firstName: data.firstName, lastName: data.lastName, dateOfBirth: data.dateOfBirth,
    gender: data.gender, email: data.email || null, phone: data.phone, joinDate: new Date().toISOString().slice(0, 10),
  })
  const a = response.data
  return { ...data, athleteId: a.athleteId, name: `${a.firstName} ${a.lastName}`, age: ageOf(a.dateOfBirth), status: 'Active', team: null, membership: null, attendance: null }
}
