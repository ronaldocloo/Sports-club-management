import apiClient, { USE_MOCKS } from './client'
import { getAthleteDirectory, getAthleteProfile } from './athletes'
import { getBookings, getFacilities, getMembers, getPayments, getRevenueByMonth } from './operations'
import { scoreRetention } from '../utils/retention'
import { linearFit, mean } from '../utils/trend'
import { TODAY } from '../utils/today'

// Explainable statistical insights. Real mode: computed on the server from the organization's data.
// Demo mode: the same rules applied to sample data in the browser.
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const METHOD = 'Each athlete gets 0–100 points from membership status, attendance level and trend, unpaid balance and loyalty. High is 60+, Medium 35+. Every factor is listed so you can check the reasoning.'

export async function getRetention() {
  if (!USE_MOCKS) return (await apiClient.get('/intelligence/retention')).data
  await delay()
  const [members, directory] = await Promise.all([getMembers(), getAthleteDirectory()])
  const byAthlete = new Map()
  members.forEach((m) => { const cur = byAthlete.get(m.athleteId); if (!cur || m.expiry > cur.expiry) byAthlete.set(m.athleteId, m) })
  let high = 0, medium = 0, low = 0
  const rows = []
  directory.forEach((a) => {
    const m = byAthlete.get(a.athleteId)
    const days = m ? Math.ceil((new Date(m.expiry) - TODAY) / 86400000) : null
    const r = scoreRetention({
      daysToMembershipEnd: days, membershipActive: !!m && days >= 0, recentAttendance: a.attendance ?? null, earlierAttendance: null,
      noRecentAttendance: false, outstandingBalance: m?.payment === 'Overdue' ? 50 : 0, membershipAgeDays: 200, hasRenewedBefore: false,
    })
    if (r.band === 'High') high++; else if (r.band === 'Medium') medium++; else low++
    if (r.score >= 20) rows.push({ athleteId: a.athleteId, name: a.name, sport: a.sport, score: r.score, band: r.band, action: r.action, factors: r.factors, hasAccount: a.athleteId % 3 === 0 })
  })
  rows.sort((x, y) => y.score - x.score || x.name.localeCompare(y.name))
  return { athletes: rows.slice(0, 100), high, medium, low, method: METHOD }
}

export async function nudgeAthlete(athleteId, hasAccount) {
  if (!USE_MOCKS) return (await apiClient.post(`/intelligence/retention/${athleteId}/nudge`)).data
  await delay(200)
  if (!hasAccount) throw new Error('This athlete has no user account to notify. Contact them directly.')
  return { notified: 1 }
}

export async function getRevenueForecast() {
  if (!USE_MOCKS) return (await apiClient.get('/intelligence/revenue-forecast')).data
  await delay()
  const rev = await getRevenueByMonth()
  const history = rev.map((m, i) => ({ month: `2026-${String(4 + i).padStart(2, '0')}`, value: m.memberships + m.competitions + m.facilities + m.other }))
  const y = history.map((h) => h.value)
  const fit = linearFit(y)
  const forecast = [1, 2, 3].map((i) => {
    const expected = Math.max(0, fit.predict(y.length - 1 + i))
    const band = 1.28 * fit.residualStd
    return { month: `2026-${String(9 + i).padStart(2, '0')}`, expected: Math.round(expected), low: Math.round(Math.max(0, expected - band)), high: Math.round(expected + band) }
  })
  return {
    history, forecast, monthlyChange: Math.round(fit.slope), method: `Straight-line trend over the last ${y.length} months; the shaded range is the typical month-to-month variation (about 80%).`,
    pipeline: { membershipsEnding: 14, amountEnding: 3650, renewalProbability: 0.71, expectedRenewals: 2592, atRisk: 1058 }, note: null,
  }
}

export async function getAttendanceOutlook() {
  if (!USE_MOCKS) return (await apiClient.get('/intelligence/attendance-outlook')).data
  await delay()
  return [
    { teamId: 1, team: 'Falcons FC', currentRate: 78, previousRate: 84, projectedRate: 71, status: 'Declining' },
    { teamId: 3, team: 'Accra Hoops', currentRate: 88, previousRate: 86, projectedRate: 90, status: 'Steady' },
    { teamId: 5, team: 'Track Blazers', currentRate: 62, previousRate: 74, projectedRate: 54, status: 'At risk' },
    { teamId: 6, team: 'Spikers VC', currentRate: 81, previousRate: 72, projectedRate: 89, status: 'Improving' },
  ]
}

export async function getFacilityDemand() {
  if (!USE_MOCKS) return (await apiClient.get('/intelligence/facility-demand')).data
  await delay()
  const [bookings, facilities] = await Promise.all([getBookings(), getFacilities()])
  const slots = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
  const open = facilities.filter((f) => f.status === 'Available').length
  const predicted = DAYS.map(() => slots.map(() => 0))
  bookings.forEach((b) => {
    const day = (new Date(b.date).getDay() + 6) % 7
    const slot = slots.indexOf(b.time)
    if (slot >= 0) predicted[day][slot] += 1
  })
  const all = []
  DAYS.forEach((day, d) => slots.forEach((slot, s) => all.push({ day, slot, predictedBookings: predicted[d][s], perFacility: open ? Math.round((predicted[d][s] / open) * 100) / 100 : 0 })))
  const peaks = [...all].filter((x) => x.predictedBookings > 0).sort((a, b) => b.predictedBookings - a.predictedBookings).slice(0, 5)
  const quiet = [...all].filter((x) => DAYS.indexOf(x.day) < 5 && !['06:00', '20:00'].includes(x.slot)).sort((a, b) => a.predictedBookings - b.predictedBookings).slice(0, 5)
  return {
    days: DAYS, slots, predicted, peaks, quiet, weeksAnalysed: 1, openFacilities: open,
    recommendations: [`${peaks[0].day} ${peaks[0].slot} is expected to be the busiest slot. Book early or add capacity.`, `Schedule maintenance on ${quiet[0].day} ${quiet[0].slot}: it is rarely booked.`],
  }
}

export async function getAnomalies() {
  if (!USE_MOCKS) return (await apiClient.get('/intelligence/anomalies')).data
  await delay()
  const payments = await getPayments()
  const out = []
  payments.filter((p) => p.status === 'Pending' && (TODAY - new Date(p.date)) / 86400000 > 14).slice(0, 4)
    .forEach((p) => out.push({ severity: 'info', type: 'Stale pending payment', title: `Payment #${p.id} from ${p.member} is still pending`, detail: `Pending since ${p.date} (GH₵${p.amount}).`, link: '/payments' }))
  const failedBy = {}
  payments.filter((p) => p.status === 'Failed').forEach((p) => { failedBy[p.member] = (failedBy[p.member] || 0) + 1 })
  Object.entries(failedBy).filter(([, n]) => n >= 2).forEach(([member, n]) => out.push({ severity: 'warning', type: 'Repeated failures', title: `${member} has ${n} failed payments in 30 days`, detail: 'Their payment method may need attention.', link: '/payments' }))
  const completed = payments.filter((p) => p.status === 'Paid').length
  const refunded = payments.filter((p) => p.status === 'Refunded').length
  if (completed + refunded >= 5 && (refunded * 100) / (completed + refunded) > 15) out.push({ severity: 'danger', type: 'High refund rate', title: `${Math.round((refunded * 100) / (completed + refunded))}% of payments were refunded`, detail: `${refunded} of ${completed + refunded} payments. Worth checking why.`, link: '/payments' })
  return out
}

// Trend, comparison with the team, and consistency for one athlete.
export async function getAthleteInsight(athleteId) {
  if (!USE_MOCKS) {
    try { return (await apiClient.get(`/intelligence/athletes/${athleteId}`)).data } catch { return null }
  }
  const p = await getAthleteProfile(athleteId)
  if (!p?.performance?.trend?.length) return null
  const y = p.performance.trend.map((t) => t.score)
  const fit = linearFit(y)
  const trend = fit.slope > 0.8 ? 'Improving' : fit.slope < -0.8 ? 'Declining' : 'Steady'
  const change = Math.round(((y.at(-1) - y[0]) / y[0]) * 1000) / 10
  const highlights = [`${p.firstName}'s rating has been ${trend.toLowerCase()} over the last ${y.length} records (${change >= 0 ? '+' : ''}${change}% from the first to the latest).`]
  if (p.attendance) {
    const d = p.attendance.recentRate - p.attendance.earlierRate
    if (Math.abs(d) >= 5) highlights.push(`Training attendance is ${d > 0 ? 'improving' : 'declining'} (${p.attendance.earlierRate}% earlier, ${p.attendance.recentRate}% recently).`)
  }
  return { athleteId, performanceTrend: trend, ratingChangePct: change, latestRating: y.at(-1), teamAverage: Math.round(mean(y) * 10) / 10, consistency: null, attendanceTrend: 'Steady', highlights }
}
