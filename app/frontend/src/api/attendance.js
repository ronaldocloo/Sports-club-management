import apiClient, { USE_MOCKS } from './client'
import { mockAthletes } from '../mocks/mockData'

// Training sessions and attendance. Demo mode keeps a few sample sessions in memory.
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))
const STATUSES = ['Present', 'Present', 'Present', 'Late', 'Present', 'Absent', 'Present', 'Excused']

function seedDemo() {
  const rows = []
  let id = 1
  ;[1, 2].forEach((teamId) => {
    const roster = mockAthletes.filter((a) => a.teamId === teamId).slice(0, 8)
    for (let i = 0; i < 6; i++) {
      const day = String(2 + i * 5).padStart(2, '0')
      rows.push({
        id: id++, teamId, date: `2026-09-${day}`, time: '08:00', location: 'Main Stadium Pitch', notes: '',
        attendance: roster.map((a, j) => ({ athleteId: a.athleteId, status: STATUSES[(i + j) % STATUSES.length] })),
      })
    }
  })
  return rows
}
let demoSessions = seedDemo()

const session = (s) => ({ id: s.sessionId, teamId: s.teamId, date: s.sessionDate, time: String(s.startTime).slice(0, 5), location: s.location || '', notes: s.notes || '', attendance: s.attendance || [] })

export async function getTrainingSessions(teamId) {
  if (USE_MOCKS) { await delay(); return demoSessions.filter((s) => !teamId || s.teamId === Number(teamId)).sort((a, b) => b.date.localeCompare(a.date)) }
  const { data } = await apiClient.get('/training-sessions', { params: teamId ? { teamId } : {} })
  return data.map(session)
}

export async function createTrainingSession(values) {
  if (USE_MOCKS) {
    await delay(200)
    const s = { id: Date.now(), teamId: Number(values.teamId), date: values.date, time: values.time, location: values.location || '', notes: values.notes || '', attendance: [] }
    demoSessions = [s, ...demoSessions]
    return s
  }
  const { data } = await apiClient.post('/training-sessions', { teamId: Number(values.teamId), sessionDate: values.date, startTime: `${values.time}:00`, location: values.location || null, notes: values.notes || null })
  return session(data)
}

export async function recordAttendance(sessionId, entries) {
  if (USE_MOCKS) {
    await delay(200)
    demoSessions = demoSessions.map((s) => (s.id === sessionId ? { ...s, attendance: entries } : s))
    return demoSessions.find((s) => s.id === sessionId)
  }
  const { data } = await apiClient.put(`/training-sessions/${sessionId}/attendance`, { entries })
  return session(data)
}

export async function deleteTrainingSession(sessionId) {
  if (USE_MOCKS) { demoSessions = demoSessions.filter((s) => s.id !== sessionId); return }
  await apiClient.delete(`/training-sessions/${sessionId}`)
}

// One athlete's attendance in the shape the profile page uses, or null when nothing is recorded
// (or the role may not see it).
export async function getAthleteAttendance(athleteId) {
  try {
    const { data: d } = await apiClient.get(`/attendance/athletes/${athleteId}`)
    if (!d.total) return null
    return {
      sessions: d.sessions.map((s) => s.status),
      counts: { Present: d.present, Late: d.late, Absent: d.absent, Excused: d.excused },
      rate: d.rate ?? 0,
      recentRate: d.recentRate ?? d.rate ?? 0,
      earlierRate: d.earlierRate ?? d.rate ?? 0,
    }
  } catch {
    return null
  }
}

// Attendance rates for every visible athlete: { [athleteId]: { rate, recentRate, earlierRate } }.
export async function getAttendanceRates() {
  try {
    const { data } = await apiClient.get('/attendance/athletes')
    return Object.fromEntries(data.filter((d) => d.total > 0).map((d) => [d.athleteId, { rate: d.rate, recentRate: d.recentRate, earlierRate: d.earlierRate }]))
  } catch {
    return {}
  }
}
