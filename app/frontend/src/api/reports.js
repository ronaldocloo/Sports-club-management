import apiClient, { USE_MOCKS, errorMessage } from './client'
import { getReports as legacyReports } from './analytics'
import { getTrainingSessions } from './attendance'
import { getCompetitions } from './competitions'
import { getMembers } from './operations'
import { exportCsv, exportExcel, exportPdf } from '../utils/export'

// The seven reports. `roles` are the roles that may run each one (Admin and Super Admin may run all).
export const reportTypes = [
  { key: 'athletes', title: 'Athletes', description: 'Roster, demographics, team, membership and attendance.', roles: ['FrontDesk'], team: true },
  { key: 'memberships', title: 'Memberships', description: 'Plans, dates, amounts charged, paid and outstanding.', roles: ['FrontDesk'] },
  { key: 'financial', title: 'Financial', description: 'Every payment in the period, with totals collected, pending and refunded.', roles: ['FrontDesk'] },
  { key: 'attendance', title: 'Attendance', description: 'Sessions attended, late, absent and excused per athlete.', roles: ['Coach'], team: true },
  { key: 'performance', title: 'Performance', description: 'Average, latest and best ratings per athlete.', roles: ['Coach'], team: true },
  { key: 'facilities', title: 'Facilities', description: 'Bookings, cancellations and utilization per facility.', roles: [] },
  { key: 'competitions', title: 'Competitions', description: 'Competitions in the period with teams, fixtures and winners.', roles: [] },
]

export function reportsFor(role) {
  if (role === 'Admin' || role === 'SuperAdmin') return reportTypes
  return reportTypes.filter((r) => r.roles.includes(role))
}

// ---------- demo builders (sample data, same shape as the server's reports) ----------
async function demoReport(type) {
  const stat = (label, value) => ({ label, value: String(value) })
  const base = { type, organization: 'Ashesi Sports Club', generatedAt: new Date().toISOString() }
  const legacy = { athletes: 'athlete', financial: 'financial', performance: 'performance', facilities: 'facility' }
  if (legacy[type]) {
    const all = await legacyReports()
    const r = all.find((x) => x.key === legacy[type])
    return { ...base, title: r.title, summary: r.summary, columns: r.columns, rows: r.rows }
  }
  if (type === 'memberships') {
    const m = await getMembers()
    return { ...base, title: 'Membership report', summary: [stat('Memberships', m.length)], columns: ['Athlete', 'Sport', 'Plan', 'Start', 'End', 'Payment'], rows: m.map((x) => [x.name, x.sport, x.type, x.start, x.expiry, x.payment]) }
  }
  if (type === 'attendance') {
    const s = await getTrainingSessions()
    const rows = s.map((x) => { const c = x.attendance.reduce((a, e) => ({ ...a, [e.status]: (a[e.status] || 0) + 1 }), {}); return [x.date, `Team ${x.teamId}`, x.attendance.length, c.Present || 0, c.Late || 0, c.Absent || 0, c.Excused || 0] })
    return { ...base, title: 'Attendance report', summary: [stat('Sessions', s.length)], columns: ['Date', 'Team', 'Marked', 'Present', 'Late', 'Absent', 'Excused'], rows }
  }
  const comps = await getCompetitions()
  return { ...base, title: 'Competition report', summary: [stat('Competitions', comps.length)], columns: ['Competition', 'Date', 'Venue', 'Status'], rows: comps.map((c) => [c.competitionName, c.date, c.location, c.status]) }
}

// Preview data. Real mode asks the server; `total` is the full row count when a limit is applied.
export async function fetchReport(type, { from, to, teamId, limit }) {
  if (USE_MOCKS) {
    const r = await demoReport(type)
    return { ...r, from, to, total: r.rows.length, rows: limit ? r.rows.slice(0, limit) : r.rows }
  }
  const response = await apiClient.get(`/reports/${type}`, { params: { from, to, teamId: teamId || undefined, limit } })
  return { ...response.data, total: Number(response.headers['x-total-rows'] ?? response.data.rows.length) }
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Downloads the report as a file. Real mode: the server generates a real CSV/.xlsx/PDF.
export async function downloadReport(type, format, { from, to, teamId }) {
  if (USE_MOCKS) {
    const r = await demoReport(type)
    const report = { ...r, key: type }
    if (format === 'csv') exportCsv(report)
    else if (format === 'xlsx') exportExcel(report)
    else if (exportPdf(report) === false) throw new Error('Pop-up blocked')
    return
  }
  try {
    const response = await apiClient.get(`/reports/${type}`, { params: { from, to, teamId: teamId || undefined, format }, responseType: 'blob' })
    const disposition = response.headers['content-disposition'] || ''
    const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] || `${type}-report.${format}`
    saveBlob(response.data, name)
  } catch (err) {
    // A failed download comes back as a blob; read the server's message out of it.
    if (err?.response?.data instanceof Blob) {
      try { err.response.data = JSON.parse(await err.response.data.text()) } catch { /* not JSON */ }
    }
    throw new Error(errorMessage(err, 'The report could not be generated.'))
  }
}
