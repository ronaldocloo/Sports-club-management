import apiClient, { USE_MOCKS } from './client'
import { invalidate, loadAll } from './raw'
import { coachesOf } from './realData'
import { mockCoaches } from '../mocks/coachData'
import { TODAY_ISO } from '../utils/today'

// Demo mode: coaches live in memory. Real mode: GET/POST /coaches.
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))
let demoCoaches = [...mockCoaches]

export async function getCoaches() {
  if (USE_MOCKS) { await delay(); return demoCoaches }
  return coachesOf(await loadAll())
}

export async function getCoachById(coachId) {
  return (await getCoaches()).find((c) => c.coachId === Number(coachId)) || null
}

export async function createCoach(data) {
  if (USE_MOCKS) {
    await delay(600)
    const coach = {
      coachId: Math.max(0, ...demoCoaches.map((c) => c.coachId)) + 1,
      teams: [], athletes: 0, certifications: [], today: [],
      schedule: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] },
      status: 'Active',
      ...data,
      experienceYears: Number(data.experienceYears) || 0,
    }
    demoCoaches = [coach, ...demoCoaches]
    return coach
  }
  const specialty = (data.specialization || data.sport || '').trim()
  const hire = data.experienceYears ? new Date(new Date(TODAY_ISO).getFullYear() - Number(data.experienceYears), 0, 1).toISOString().slice(0, 10) : TODAY_ISO
  const { data: c } = await apiClient.post('/coaches', { firstName: data.firstName, lastName: data.lastName, specialty, email: data.email, phone: data.phone || '0000000000', hireDate: hire })
  invalidate()
  return { coachId: c.coachId, firstName: c.firstName, lastName: c.lastName, sport: c.specialty, specialization: c.specialty, experienceYears: Number(data.experienceYears) || 0, status: 'Active', email: c.email, phone: c.phone, teams: [], athletes: 0, certifications: [], today: [], schedule: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] } }
}
