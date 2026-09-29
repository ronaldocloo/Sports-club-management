import { mockCoaches } from '../mocks/coachData'

// Mock-first: swap the bodies for apiClient calls (GET /coaches) once the backend is ready.
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

let coaches = [...mockCoaches]

export async function getCoaches() {
  await delay()
  return coaches
}

export async function getCoachById(coachId) {
  await delay(350)
  return coaches.find((c) => c.coachId === Number(coachId)) || null
}

export async function createCoach(data) {
  await delay(600)
  const coach = {
    coachId: Math.max(0, ...coaches.map((c) => c.coachId)) + 1,
    teams: [], athletes: 0, certifications: [], today: [],
    schedule: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] },
    status: 'Active',
    ...data,
    experienceYears: Number(data.experienceYears) || 0,
  }
  coaches = [coach, ...coaches]
  return coach
}
